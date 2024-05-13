const { Dropbox } = require('dropbox');
const fs = require('fs');

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });

async function uploadFile(req, res) {
  try {
    //await createFolder('/test1', res);
    const folderCheck = await listFiles(`/${req.foldername}`, res);
    //console.log(folderCheck.fileList)
    
    if (folderCheck.fileList == '[]'){
      console.log("creating new folder")
      createFolder(`/${req.foldername}`, res);
    }
    if (!req.buffer) {
      let response = { success: false, error: 'File buffer not found in the request object' };
      return res.status(400).json(response);
    }

    // Determine the Dropbox path based on the file type
    let dropboxPath = `/${req.foldername}`; // Use let instead of const

    // Check if the file already exists at the specified path
    const checkResult = await dbx.filesGetMetadata({ path: dropboxPath }).catch((error) => {
      if (error.response && error.response.status === 409) {
        // File does not exist, and that's okay
        return null;
      }
      throw error;
    });

    // If the file exists, handle the conflict by appending a timestamp to the filename
    if (checkResult) {
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      dropboxPath = `/${req.foldername}/${req.filename}`;
    }

    // Upload the file to Dropbox
    const result = await dbx.filesUpload({
      path: dropboxPath,
      contents: req.buffer,
    });

    let response = { success: true, fileUploadResult: result };
    return res.json(response);
  } catch (error) {
    console.error(error);
    let response = { success: false, error: error.message };
    return res.status(500).json(response);
  }
}
async function listFiles(pathVar, res) {
  try {
    let allEntries = [];

    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      // Use the cursor to paginate through the files
      const response = await dbx.filesListFolder({ path: pathVar});
      //console.log(response)
      allEntries = allEntries.concat(response.result.entries);
      hasMore = response.result.has_more;
      cursor = response.result.cursor;
    }

    //console.log('All files and folders:', allEntries);



    let responseMessage = { success: true, fileList: allEntries };
    return responseMessage;
  } catch (error) {
    console.error(error.error || error);

    let response = { success: false, error: error.message };
    return res.status(500).json(response);
  }
}

async function createFolder(path, res) {
  try {
    //console.log('creating a new folder at :  ', path);
    // Create the folder using the Dropbox API
    const createFolderResult = await dbx.filesCreateFolderV2({ path });

    //console.log('Folder created:', createFolderResult);

    let responseMessage = { success: true, folderCreatedResult: createFolderResult };
    return res.json(responseMessage);
  } catch (error) {
    console.error(error.error || error);

    // Check if the error is due to the parent folder not existing
    if (error.error && error.error['.tag'] === 'path') {
      // Extract the parent folder path
      const parentFolderPath = error.error.path;

      // Recursively create the parent folders
      await createFolder(parentFolderPath, res);

      // Retry creating the desired folder after creating the parent folders
      await createFolder(path, res);
    } else {
      let response = { success: false, error: error.message };
      return res.status(500).json(response);
    }
  }
}
module.exports = {
  uploadFile,
  listFiles,
  createFolder
};
