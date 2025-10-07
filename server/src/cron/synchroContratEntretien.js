// synchroContratEntretien.js
const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/scriptService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');
const logs = require('../services/logs');

// -------------------------------
// Config
// -------------------------------
const boardId = 1455203182;
const typeData = 'contratEntretien';
const RATE_DELAY_MS = 150; // small throttle for Monday API

// Optional: pull Vilogi token from env instead of hardcoding
const VILOGI_TOKEN = process.env.VILOGI_TOKEN ;
const VILOGI_Auth = process.env.VILOGI_Auth ;

// -------------------------------
// Helpers
// -------------------------------
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse 'dd/mm/yyyy' -> 'yyyy-mm-dd'. Returns null if invalid. */
async function parseFRDateToISO(fr) {
  if (!fr || typeof fr !== 'string') return null;
  const [dd, mm, yyyy] = fr.split('/');
  if (!dd || !mm || !yyyy) return null;
  // Basic validation; avoid invalid dates crashing
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  // Optionally, check Date validity
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return iso;
}

/** Build Vilogi contract URL if possible */
async function buildVilogiContratURL(idFichier, idCopro, idAdh) {
  if (!idFichier || !idCopro || !idAdh || !VILOGI_TOKEN) return null;
  return `https://copro.vilogi.com/rest/contratEntretien/getFile/${idFichier}?token=${encodeURIComponent(
    VILOGI_TOKEN
  )}&idCopro=${encodeURIComponent(idCopro)}&idAdh=${encodeURIComponent(idAdh)}`;
}

/**
 * Safely extracts fournisseur info:
 *   "12345-SOME TEXT" -> { fournisseurID: "12345", label: "SOME TEXT" }
 * Returns null if it doesn't match.
 */
function extractFournisseurId(raw) {
  if (typeof raw !== 'string') return null;
  const regex = /^(\d+)\s*-\s*(.*)$/; // allow spaces around '-'
  const match = raw.match(regex);
  if (!match) return null;
  return {
    fournisseurID: match[1],
    label: match[2]?.trim() || '',
  };
}

/**
 * Formats phone number for Monday.com phone column
 * Removes invalid characters and ensures proper format
 */
function formatPhoneForMonday(phone) {
  if (!phone) return null;

  // Normalize to string and take the first number if multiple are provided
  let str = String(phone)
    .replace(/[\n\r\t]/g, ' ')
    .split(/[\/;,]|\bet\b|\bor\b/i)[0] // keep first if separated by '/', ',', ';', 'et', 'or'
    .trim();

  // Remove anything except digits and '+' (drop dots, spaces, hyphens, parentheses)
  let digits = str.replace(/[^\d+]/g, '');

  // Convert leading 00 to +
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);

  // If it starts with a single 0 and length looks like FR (10 digits), convert to +33
  const justNums = digits.replace(/\D/g, '');
  if (!digits.startsWith('+') && justNums.length === 10 && justNums.startsWith('0')) {
    digits = '+33' + justNums.slice(1);
  }

  // Basic sanity check
  if (!digits || digits.replace(/\D/g, '').length < 6) return null;

  return {
    phone: digits,
    countryShortName: 'FR',
  };
}

// -------------------------------
// Core
// -------------------------------
const synchroContratEntretien = {
  start: async () => {
    logs.logExecution('synchroContratEntretien');

    let counterStart;
    let counterEnd;
    let LogId;

    try {
      counterStart = await vilogiService.countConenction();
      LogId = await scriptService.logScriptStart('synchroContratEntretien');
      console.log('Start Extraction ...');

      const copros = await coproService.listCopropriete();

      let totalContrat = 0;

      for (const copro of copros) {
        // Expecting copro to have: idCopro, idVilogi, idMonday, maybe idAdh (if needed for file URL)
        console.log('ID Vilogi:', copro.idCopro);

        if (copro.idVilogi == null) continue;

        const contrats = await vilogiService.getCoproContratEntretien(copro.idVilogi);
        if (!Array.isArray(contrats) || contrats.length === 0) continue;

        let nbContrat = 0;

        for (const contrat of contrats) {
          nbContrat++;
          totalContrat++;

          // Fournisseur info
          const fournisseurParts = extractFournisseurId(contrat.fournisseur);
          let infoFournisseur = {};
          if (fournisseurParts?.fournisseurID) {
            try {
              infoFournisseur = (await vilogiService.getPrestataireById(
                fournisseurParts.fournisseurID,
                copro.idVilogi
              )) || {};
            } catch (e) {
              console.warn('getPrestataireById failed:', e?.message || e);
              infoFournisseur = {};
            }
          }

          // If for some reason we get nothing back, keep going (don’t break the whole copro loop)
          const hasFournisseur = infoFournisseur && Object.keys(infoFournisseur).length > 0;

          // File URL (needs copro.idAdh if your endpoint requires it; adapt as needed)
          let urlContrat = null;
          if (contrat.idFichier) {
            // If you have copro.idAdh in your data model, pass it; otherwise, keep null so it’s omitted
            console.log("copro.idCopro", copro.idVilogi);
            urlContrat = `https://copro.vilogi.com/rest/contratEntretien/getFile/${contrat.idFichier}?token=${process.env.VILOGI_TOKEN}&idCopro=${copro.idVilogi}&idAdh=${process.env.VILOGI_IDAUTH}`;  
            
          }

          // Dates
          const dateEffetISO = await parseFRDateToISO(contrat.dateeffet);
          const dateEcheanceISO = await parseFRDateToISO(contrat.dateecheance);
          const dateFinISO = await parseFRDateToISO(contrat.datefin);

          console.log(
            `Contrat #${totalContrat} — Sync contrat ID: ${contrat.id} — copro:${copro.idCopro} [${nbContrat} / ${contrats.length}]`
          );
          console.log("urlContrat", urlContrat);
          // Prepare Monday column values; omit null/undefined only where necessary
            const columnValues = {
            // texte_1: raw "12345-Label" string as given
            texte_1: contrat.fournisseur || '',
            // Assuming this is the "contrat" label/number
            texte1__1: contrat.contrat || '',
            // Fournisseur société if available
            texte_2: hasFournisseur ? infoFournisseur.societe || '' : '',
            texte_3: contrat.typecontrat || '',
            date: dateEffetISO ? { date: dateEffetISO } : null,
            date_1: dateEcheanceISO ? { date: dateEcheanceISO } : null,
            date_2: dateFinISO ? { date: dateFinISO } : null,
            texte_8: hasFournisseur ? infoFournisseur.adresse || '' : '',
            texte_10: hasFournisseur ? infoFournisseur.ville || '' : '',
            texte_11: hasFournisseur ? infoFournisseur.codepostal || '' : '',
            texte_16: hasFournisseur ? infoFournisseur.email || '' : '',
            t_lephone: hasFournisseur && infoFournisseur.telephone
              ? formatPhoneForMonday(infoFournisseur.telephone)
              : null,
            ...(copro.idMonday != null && {
              board_relation: { item_ids: [String(copro.idMonday)] },
            }),
            texte_15: hasFournisseur ? infoFournisseur.secteur || '' : '',
            // For Monday link columns: use empty string to clear value when no URL
            lien_internet_1__1: urlContrat ? { url: urlContrat, text: 'Lien vers contrat' } : '',
            texte_14: contrat.idFichier || '',
            };

          // Remove nulls that Monday might reject
          Object.keys(columnValues).forEach((k) => {
            if (columnValues[k] == null) delete columnValues[k];
          });

          const supplierLabel =
            (hasFournisseur && infoFournisseur.societe) || fournisseurParts?.label || 'Fournisseur';
          const itemName = `${copro.idCopro} - ${supplierLabel}`.trim();

          await saveOrUpdateMondayItem(itemName, columnValues, contrat.id);
          await delay(RATE_DELAY_MS);
        }
      }

      console.log('Total contrats traités:', totalContrat);

      counterEnd = await vilogiService.countConenction();
      const VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;
      await scriptService.updateLogStatus(
        'synchroContratEntretien',
        LogId,
        0,
        'Script executed successfully',
        VolumeCalls
      );

      console.log('--------------------------- END Extraction ---------------------------');
    } catch (error) {
      try {
        counterEnd = await vilogiService.countConenction();
        const VolumeCalls =
          (counterEnd?.[0]?.nombreAppel || 0) - (counterStart?.[0]?.nombreAppel || 0);
        await scriptService.updateLogStatus(
          'synchroContratEntretien',
          LogId,
          -1,
          `An error occurred: ${error.message}`,
          VolumeCalls
        );
      } catch (e) {
        // swallow logging errors
      }
      console.error('An error occurred:', error.message);
    }
  },
};

// -------------------------------
// Monday save/update
// -------------------------------
async function saveOrUpdateMondayItem(itemName, columnValues, idVilogi) {
  try {
    const existing = await mondayVilogiSyncService.getItemsByInfo(boardId, idVilogi);
    const found = Array.isArray(existing) ? existing[0] : null;

    if (found && found.mondayItenID) {
      try {
        // Verify the item still exists in Monday.com before updating
        const itemExists = await mondayService.getItemsDetails(found.mondayItenID);
        if (itemExists) {
          try {
            await mondayService.updateItem(boardId, found.mondayItenID, columnValues);
          } catch (error) {
            const errs = error.api_errors || error.graphQLErrors || [];
            const hasPhoneColumnError = Array.isArray(errs) && errs.some(e => {
              const data = e.extensions?.error_data || e.error_data || {};
              return data.column_id === 't_lephone' && data.column_type === 'phone';
            });
            if (hasPhoneColumnError) {
              const fallback = { ...columnValues };
              if (fallback.t_lephone && typeof fallback.t_lephone === 'object') {
                const phoneStr = fallback.t_lephone.phone || '';
                if (phoneStr) fallback.t_lephone = String(phoneStr);
                else delete fallback.t_lephone;
              }
              await mondayService.updateItem(boardId, found.mondayItenID, fallback);
            } else {
              throw error;
            }
          }
          await mondayService.updateItemName(boardId, found.mondayItenID, itemName);
        } else {
          // Item was deleted from Monday.com, create a new one and update our records
          console.warn(`Item ${found.mondayItenID} not found in Monday.com, creating new item for Vilogi ID ${idVilogi}`);
          const newItem = await mondayService.createItem(boardId, itemName, columnValues);
          
          // Update the existing record with new Monday ID
          await mondayVilogiSyncService.editItem(found._id, { mondayItenID: newItem.id });
        }
      } catch (updateError) {
        if (updateError.message.includes('Could not find item')) {
          // Item was deleted, create a new one
          console.warn(`Item ${found.mondayItenID} was deleted from Monday.com, creating new item for Vilogi ID ${idVilogi}`);
          const newItem = await mondayService.createItem(boardId, itemName, columnValues);
          
          // Update the existing record with new Monday ID
          await mondayVilogiSyncService.editItem(found._id, { mondayItenID: newItem.id });
        } else {
          throw updateError; // Re-throw other errors
        }
      }
    } else {
      // Create new
      let newItem;
      try {
        newItem = await mondayService.createItem(boardId, itemName, columnValues);
      } catch (error) {
        // If Monday rejects the phone column value, retry without complex object format
        const errs = error.api_errors || error.graphQLErrors || [];
        const hasPhoneColumnError = Array.isArray(errs) && errs.some(e => {
          const data = e.extensions?.error_data || e.error_data || {};
          return data.column_id === 't_lephone' && data.column_type === 'phone';
        });
        if (hasPhoneColumnError) {
          // Build a fallback payload: send phone as a simple string or drop it
          const fallback = { ...columnValues };
          if (fallback.t_lephone && typeof fallback.t_lephone === 'object') {
            const phoneStr = fallback.t_lephone.phone || '';
            // Prefer a plain string; if empty, remove the field
            if (phoneStr) fallback.t_lephone = String(phoneStr);
            else delete fallback.t_lephone;
          }
          try {
            newItem = await mondayService.createItem(boardId, itemName, fallback);
          } catch (err2) {
            throw err2; // propagate if retry also fails
          }
        } else {
          throw error;
        }
      }

      const dataMongo = {
        boardID: boardId,
        mondayItenID: newItem.id, // keep field name you use in your collection
        vilogiEndpoint: typeData,
        vilogiItemID: idVilogi,
      };

      await mondayVilogiSyncService.addItem(dataMongo);
    }
  } catch (error) {
    console.error("Erreur lors de la création/mise à jour de l'élément Monday:", error);
    // Log more detailed error information
    logs.error(`Monday sync error for Vilogi ID ${idVilogi}: ${error.message}`, error);
  }
}

module.exports = synchroContratEntretien;
