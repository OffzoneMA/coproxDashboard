
const ZendeskService = require('../services/zendeskService');
const axios = require('axios');
const logs = require('../services/logs');
require('dotenv').config();

const possibleCategories = [
  {"value":"SIGNALEMENT URGENT","tag":"signalement_urgent","default":false},
  {"value":"A RAPPELER","tag":"a_rappeler","default":false},
  {"value":"RECLAMATION","tag":"reclamation","default":false},
  {"value":"DEMANDE D'ACCES","tag":"demande_d_acces","default":false},
  {"value":"QUESTION CHARGES","tag":"question_charges","default":false},
  {"value":"FR_LRE","tag":"fr_lre","default":false},
  {"value":"FVPC/POUVOIR AG","tag":"fvpc/pouvoir_ag","default":false},
  {"value":"SINISTRE","tag":"sinistre","default":false},
  {"value":"PROCEDURE CONTENTIEUSE","tag":"procedure_contentieuse","default":false},
  {"value":"ARRIVCOPRO","tag":"arrivcopro","default":false},
  {"value":"PROSPECT","tag":"prospect","default":false},
  {"value":"INTERNE","tag":"interne","default":false},
  {"value":"LES SCANS DES FACTURES  ","tag":"les_scans_des_factures__","default":false},
  {"value":"LES SCANS DES COURRIERS ENTRANTS ","tag":"les_scans_des_courriers_entrants_","default":false},
  {"value":"LES SCANS DES ARCHIVES COPROS  ","tag":"les_scans_des_archives_copros__","default":false},
  {"value":"DOSSIER GESTION COPRO  ","tag":"dossier_gestion_copro__","default":false},
  {"value":"POUR MACOPRO  ","tag":"pour_macopro__","default":false},
  {"value":"CONTRAT MEC  ","tag":"contrat_mec__","default":false},
  {"value":"CONTRAT A ENREGISTER ","tag":"contrat_a_enregister_","default":false},
  {"value":"AG PREPA ","tag":"ag_prepa_","default":false},
  {"value":"PARTENARIAT ","tag":"partenariat_","default":false},
  {"value":"PRISE EN COMPTE MANDATAIRE ","tag":"prise_en_compte_mandataire_","default":false},
  {"value":"FACTURES NON IDENTIFIEES ","tag":"factures_non_identifiees_","default":false},
  {"value":"FACTURES PRESTA RELANCE ","tag":"factures_presta_relance_","default":false},
  {"value":"FACTURES PRESTA  TRAVAUX COURANT ","tag":"factures_presta__travaux_courant_","default":false},
  {"value":"FACTURES PRESTA TRAVAUX AG ","tag":"factures_presta_travaux_ag_","default":false},
  {"value":"FACTURES PRESTA CONTRAT  ","tag":"factures_presta_contrat__","default":false},
  {"value":"FACTURES PRESTA FLUIDE ","tag":"factures_presta_fluide_","default":false},
  {"value":"PROSPECT ","tag":"prospect_","default":false},
  {"value":"ARRIVCOPRO ","tag":"arrivcopro_","default":false},
  {"value":"PROCEDURES CONTENTIEUSES CHARGES ","tag":"procedures_contentieuses_charges_","default":false},
  {"value":"PROCEDURES CONTENTIEUSES COPRO  ","tag":"procedures_contentieuses_copro__","default":false},
  {"value":"AVIS DE VIREMENT ","tag":"avis_de_virement_","default":false},
  {"value":"SEPA","tag":"sepa","default":false},
  {"value":"VENTE - ED A REALISER  ","tag":"vente_-_ed_a_realiser__","default":false},
  {"value":"VENTE - PED VALIDE ","tag":"vente_-_ped_valide_","default":false},
  {"value":"VENTE  - DEMANDE INFORMATION ","tag":"vente__-_demande_information_","default":false},
  {"value":"Autre","tag":"autre","default":false}
];


async function categorizeEmail(emailContent) {
  try {
    const categoriesList = possibleCategories.map(category => category.value).join(', ');
    const messageaEnvoyer = `peux tu lire ce text essayer de comprendre le sens general et me dire De quelle catégorie parmi cette liste de catégories est la plus pertinantes strictement dans les catégories possibles, si tu en trouves pas la réponse que tu dois me donner est : "Autre" ? Je souhaite avoir comme réponse  : "categorie : Nom de la categorie . Les catégories possibles sont : ${categoriesList}.\n${emailContent}.\n "`
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: messageaEnvoyer },
      ],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`,
      },
    });
    //console.log(messageaEnvoyer)
    const categories = response.data.choices[0].message.content;

    const foundCategories = possibleCategories.filter(category => {
      const escapedCategory = category.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\W]*');
      const regex = new RegExp(`\\b${escapedCategory}\\b`, 'i');
      return regex.test(categories);
    });

    console.log(categories);
    console.log(foundCategories);
    return foundCategories;
  } catch (error) {
    console.error('Error categorizing email:', error.message);
    throw error;
  }
}

async function fetchZendeskTickets() {
  try {
    const response = await axios.get(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json?status=new&sort_by=created_at&sort_order=desc&per_page=1"`, {
      auth: {
        username: process.env.ZENDESK_USERNAME,
        password: process.env.ZENDESK_PASSWORD,
      },
    });

    return response.data.tickets;
  } catch (error) {
    console.error(`Error fetching Zendesk tickets with status news:`, error.message);
    throw error;
  }
}

async function categorizeAndHandleTickets(ticket) {
  if (ticket.status !== 'new') {
    console.log(`Skipping ticket ${ticket.id} because its status is not open.`);
    return null;
  }
  const emailContent = ticket.description; // Assuming the ticket content is in the description field

  try {
    const categories = await categorizeEmail(emailContent);
    await updateZendeskTicketCategory(ticket.id, categories);
    return { ticketId: ticket.id, categories };
  } catch (error) {
    console.error(`Error categorizing Zendesk ticket ${ticket.id}:`, error.message);
    return { ticketId: ticket.id, error: error.message };
  }
}

async function updateZendeskTicketCategory(ticketId, categories) {
  try {
    const categoryToUpdate = categories.length > 0 ? categories[0] : 'Uncategorized';
    const valueData=categoryToUpdate.tag;
    console.log("the category to update is : ",valueData)
    
    const updateData = {
      "ticket": {
        "custom_status_id": "15662538914333",
        "custom_fields": [
          {
            "id": "15114688584221",
            "value": valueData,
          }]


      }
    };
    await ZendeskService.updateTicket(ticketId,updateData)
  } catch (error) {
    console.error(`Error updating Zendesk ticket ${ticketId} category:`, error.message);
    throw error;
  }
}

async function categorizeNewZendeskTickets() {
  try {
    const tickets = await ZendeskService.getTicketsNew();
    const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Process the tickets in reverse order (from latest to oldest)
    const reversedTickets = tickets.reverse();

    const categorizedTickets = [];

    for (const ticket of reversedTickets) {
      const result = await categorizeAndHandleTickets(ticket);
      categorizedTickets.push(result);

      // Add a delay between tickets (e.g., 5000 milliseconds = 5 seconds)
      await delay(5000);
    }

    return categorizedTickets;
  } catch (error) {
    console.error('Error categorizing Zendesk tickets:', error.message);
    throw error;
  }
}

// Modified code for zendeskTicketAI
const zendeskTicketAI = {
  start: async () => {
    try {
      const categorizedTickets = await categorizeNewZendeskTickets();
      console.log('Categorized Zendesk tickets:', categorizedTickets);
    } catch (error) {
      console.error('Error:', error);
    }
  },
};

// Example usage
// Uncomment the line below if you want to use the existing example
// zendeskTicketAI.start();
module.exports = zendeskTicketAI;
