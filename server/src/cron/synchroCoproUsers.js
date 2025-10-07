const vilogiService = require('../services/vilogiService');
const userService = require('../services/userService');
const coproService = require('../services/coproService');
const zendeskService =require('../services/zendeskService');
const scriptService = require('../services/scriptService');
const mondayService = require('../services/mondayService');
const logs = require('../services/logs');
const MongoDB = require('../utils/mongodb');
const LesCoprosIDBoard=1404452123
const LesCoprosInfoMorteIDBoard=1436164777

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let responsiblesCopro=[]

const synchroCoproUsers = {
    start: async () => {
        
        logs.logExecution("synchroCopro")
        //let counterStart =await vilogiService.countConenction();
        //const LogId = await scriptService.logScriptStart('synchroCopro');
        try {
            // Prefetch all Zendesk organizations and fields once
            const [orgZendesk, organizationFields] = await Promise.all([
              zendeskService.getAllOrganizations(),
              zendeskService.getOrganizationFields()
            ]);
            // Build a map from field titles to field keys and available tags
            const fieldTitleToKey = new Map();
            const fieldKeyToTags = new Map();
            if (Array.isArray(organizationFields)) {
              for (const f of organizationFields) {
                if (f && f.title && f.key) {
                  fieldTitleToKey.set(f.title, f.key);
                  // Store available tags for this field if it has them
                  if (f.custom_field_options && Array.isArray(f.custom_field_options)) {
                    const tags = f.custom_field_options.map(option => option.value || option.name);
                    fieldKeyToTags.set(f.key, tags);
                  }
                }
              }
            }
            console.log("fieldTitleToKey", Array.from(fieldTitleToKey.entries()));
            console.log("fieldKeyToTags", Array.from(fieldKeyToTags.entries()));

            let dataSourceCopros = await mondayService.getItems(LesCoprosIDBoard);
            for (const copro of dataSourceCopros) {
                console.log("Starting with copro", copro);
                let findCopro = await mondayService.getItemsDetails(copro.id)
                responsiblesCopro=[]
                for (const col of findCopro.column_values) {
                  //console.log(col);
                    if (col.type === "people") { 
                      //responsiblesCopro.append({column.title : JSON.parse(col.value).personsAndTeams[0].id }) 
                      responsiblesCopro.push({
                        role: col.column.title,
                        personId: JSON.parse(col.value).personsAndTeams[0]?.id || null
                      });//gerantation of an array with all responsible peoples
                      //console.log(col);
                    }
                }
                // Small pacing to avoid rate limits
                await delay(100);

                // Find matching Zendesk organization by name (idCopro)
                const existingOrg = orgZendesk.find(org => org.name === copro.name);

                if (existingOrg) {
                  await convertUsersToDBID(responsiblesCopro, copro.name, existingOrg.id, fieldTitleToKey, fieldKeyToTags);
                } else {
                  console.warn("Zendesk org not found for copro", copro.name);
                }

                await delay(200); // Delay of 200ms between requests

                console.log("responsiblesCopro", responsiblesCopro);


            }
            let counterEnd =await vilogiService.countConenction();
            //let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel
            //console.log(VolumeCalls)
            //await scriptService.updateLogStatus('synchroCopro',LogId ,0 ,`Script executed successfully `, VolumeCalls );
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {

            console.error("Une erreur est survenue :", error);
            //await scriptService.updateLogStatus('synchroCopro', LogId, -1, `Script executed with Error: ${error.message}`);
            return; 
          
        }

                                          
            
    }

}


async function convertUsersToDBID(responsiblesCopro, coproName, orgId, fieldTitleToKey, fieldKeyToTags){
  let update={}
  for (const role of responsiblesCopro) {
    //console.log(role)
    if (!role.personId) continue;
    const userData = await userService.getUserByMondayId(role.personId);
    //console.log("userData", userData);
    if(userData){
      update=({...update,
              [role.role]: userData.id
            })
    }
  }
  // Convert to organization_fields hash format using field keys and validate against available tags
  const organizationFields = {}
  for (const [title, value] of Object.entries(update)){
    const fieldKey = fieldTitleToKey.get(title);
    if (fieldKey) {
      const availableTags = fieldKeyToTags.get(fieldKey);
      if (availableTags && availableTags.length > 0) {
        // For dropdown/tag fields with format "prefix_value", find matching tag
        let matchingTag = null;
        
        // First try exact match
        if (availableTags.includes(value)) {
          matchingTag = value;
        } else {
          // Try to find tag that ends with our value (format: prefix_value)
          matchingTag = availableTags.find(tag => tag.endsWith(`_${value}`));
          
          if (!matchingTag) {
            // Try to find tag that contains our value
            matchingTag = availableTags.find(tag => tag.includes(value));
          }
        }
        
        if (matchingTag) {
          organizationFields[fieldKey] = matchingTag;
          console.log(`Mapped "${value}" to "${matchingTag}" for field "${title}"`);
        } else {
          console.warn(`Value "${value}" not found in available tags for field "${title}": ${availableTags.join(', ')}`);
          // Use the first available tag as fallback
          organizationFields[fieldKey] = availableTags[0];
          console.log(`Using fallback "${availableTags[0]}" for field "${title}"`);
        }
      } else {
        // For text fields or fields without tags, use the value directly
        organizationFields[fieldKey] = value;
      }
    } else {
      console.warn(`Zendesk field not found for title: ${title}`);
    }
  }

  await updateZendeskORg(coproName, orgId, organizationFields)
  //console.log("update", update)
  //console.log("organizationFields", organizationFields)

}

async function updateZendeskORg(coproName, orgId, organizationFields) {
  // Build organization update payload with organization_fields as hash
  const organizationData = {
    "organization": {
      "organization_fields": {
        ...organizationFields,
        "copro_name": coproName
      }
    }
  };
  console.log("organizationData", JSON.stringify(organizationData, null, 2));
  await zendeskService.updateOrganization(orgId, organizationData);
}

module.exports = synchroCoproUsers;
