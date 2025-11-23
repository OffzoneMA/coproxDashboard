const path = require('path');
const fs = require('fs').promises;
const { createServiceLogger } = require('../services/logger');
const { logger, logError } = createServiceLogger('documents');
const coproService = require('../services/coproService');

const DOWNLOADS_PATH = path.join(__dirname, '../../downloads');

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
  try {
    const folderChecks = {};
    const folders = ['archives', 'contrats', 'factureOCR', 'zendesk'];
    
    for (const folder of folders) {
      const folderPath = path.join(DOWNLOADS_PATH, folder);
      try {
        await fs.access(folderPath);
        folderChecks[folder] = 'accessible';
      } catch {
        folderChecks[folder] = 'not found';
      }
    }
    
    res.json({
      status: 'ok',
      message: 'Documents API is working',
      downloadsPath: DOWNLOADS_PATH,
      folders: folderChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get list of all documents with their metadata
 */
const listDocuments = async (req, res) => {
  try {
    logger.info('Listing all documents');
    
    const documents = [];
    const folders = ['archives', 'contrats', 'factureOCR', 'zendesk'];
    
    for (const folder of folders) {
      const folderPath = path.join(DOWNLOADS_PATH, folder);
      
      try {
        // Check if folder exists
        await fs.access(folderPath);
        
        // Read folder contents recursively
        const files = await getFilesRecursively(folderPath, folder);
        documents.push(...files);
      } catch (error) {
        logger.warn(`Folder not found or inaccessible: ${folder}`);
      }
    }
    
    logger.info(`Found ${documents.length} documents`);
    res.json({
      success: true,
      count: documents.length,
      documents
    });
    
  } catch (error) {
    logError(error, 'Error listing documents');
    res.status(500).json({
      success: false,
      error: 'Failed to list documents',
      message: error.message
    });
  }
};

/**
 * Get all unique tags/categories from documents (based on copro names)
 */
const listTags = async (req, res) => {
  try {
    logger.info('Listing document tags (copro names)');
    
    // Get all active copropriétés from database
    const copros = await coproService.listCopropriete();
    
    // Extract unique copro names and IDs
    const tags = copros.map(copro => ({
      id: copro._id,
      idCopro: copro.idCopro,
      name: copro.Nom || copro.name || copro.idCopro,
      ville: copro.ville,
      status: copro.status || 'Actif'
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    logger.info(`Found ${tags.length} copro tags`);
    res.json({
      success: true,
      count: tags.length,
      tags: tags
    });
    
  } catch (error) {
    logError(error, 'Error listing tags');
    res.status(500).json({
      success: false,
      error: 'Failed to list tags',
      message: error.message
    });
  }
};

/**
 * Get documents by tag/category (copro name)
 */
const getDocumentsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    logger.info('Getting documents by copro name', { meta: { tag } });
    
    // Get all documents from all folders
    const allDocuments = [];
    const folders = ['archives', 'contrats', 'factureOCR', 'zendesk'];
    
    for (const folder of folders) {
      const folderPath = path.join(DOWNLOADS_PATH, folder);
      
      try {
        await fs.access(folderPath);
        const files = await getFilesRecursively(folderPath, folder);
        allDocuments.push(...files);
      } catch (error) {
        logger.warn(`Folder not found: ${folder}`);
      }
    }
    
    // Filter documents that contain the copro name in their filename or path
    const filteredDocuments = allDocuments.filter(doc => {
      const searchText = `${doc.name} ${doc.path}`.toLowerCase();
      const tagLower = tag.toLowerCase();
      return searchText.includes(tagLower);
    });
    
    logger.info(`Found ${filteredDocuments.length} documents for copro: ${tag}`);
    res.json({
      success: true,
      tag,
      count: filteredDocuments.length,
      documents: filteredDocuments
    });
    
  } catch (error) {
    logError(error, 'Error getting documents by tag', { tag: req.params.tag });
    res.status(500).json({
      success: false,
      error: 'Failed to get documents by tag',
      message: error.message
    });
  }
};

/**
 * Download a specific document
 */
const downloadDocument = async (req, res) => {
  try {
    const { filepath } = req.params;
    const filePath = path.join(DOWNLOADS_PATH, filepath);
    
    logger.info('Downloading document', { meta: { filepath } });
    
    // Security check: ensure path is within downloads directory
    const resolvedPath = path.resolve(filePath);
    const downloadsDir = path.resolve(DOWNLOADS_PATH);
    
    if (!resolvedPath.startsWith(downloadsDir)) {
      logger.warn('Attempted path traversal attack', { meta: { filePath } });
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Check if file exists
    await fs.access(resolvedPath);
    
    // Get file stats
    const stats = await fs.stat(resolvedPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({
        success: false,
        error: 'Not a file'
      });
    }
    
    // Get filename for download
    const filename = path.basename(resolvedPath);
    
    // Send file
    res.download(resolvedPath, filename, (err) => {
      if (err) {
        logError(err, 'Error downloading file', { filepath });
      }
    });
    
  } catch (error) {
    logError(error, 'Error downloading document', { 
      filepath: req.params.filepath
    });
    res.status(404).json({
      success: false,
      error: 'Document not found',
      message: error.message
    });
  }
};

/**
 * Helper function to recursively get all files in a directory
 */
async function getFilesRecursively(dir, category) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(DOWNLOADS_PATH, fullPath);
      
      if (entry.isDirectory()) {
        // Recursively get files from subdirectories
        const subFiles = await getFilesRecursively(fullPath, category);
        files.push(...subFiles);
      } else {
        // Get file stats
        try {
          const stats = await fs.stat(fullPath);
          const ext = path.extname(entry.name).toLowerCase();
          
          files.push({
            name: entry.name,
            path: relativePath,
            category: category,
            size: stats.size,
            sizeReadable: formatFileSize(stats.size),
            type: getFileType(ext),
            extension: ext,
            created: stats.birthtime,
            modified: stats.mtime,
            downloadUrl: `/documents/download/${encodeURIComponent(relativePath)}`
          });
        } catch (statError) {
          logger.warn(`Could not stat file: ${fullPath}`);
        }
      }
    }
  } catch (error) {
    logger.warn(`Could not read directory: ${dir}`, { error: error.message });
  }
  
  return files;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Determine file type based on extension
 */
function getFileType(ext) {
  const types = {
    '.pdf': 'PDF Document',
    '.doc': 'Word Document',
    '.docx': 'Word Document',
    '.xls': 'Excel Spreadsheet',
    '.xlsx': 'Excel Spreadsheet',
    '.txt': 'Text File',
    '.csv': 'CSV File',
    '.jpg': 'Image',
    '.jpeg': 'Image',
    '.png': 'Image',
    '.gif': 'Image',
    '.zip': 'Archive',
    '.rar': 'Archive',
    '.eml': 'Email',
    '.msg': 'Email'
  };
  
  return types[ext] || 'Unknown';
}

/**
 * Format category name to readable label
 */
function formatCategoryLabel(category) {
  const labels = {
    'archives': 'Archives',
    'contrats': 'Contrats',
    'factureOCR': 'Factures OCR',
    'zendesk': 'Zendesk',
    'courrier': 'Courrier',
    'sinistres': 'Sinistres'
  };
  
  return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

module.exports = {
  healthCheck,
  listDocuments,
  listTags,
  getDocumentsByTag,
  downloadDocument
};
