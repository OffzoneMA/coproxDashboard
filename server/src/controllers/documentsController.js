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
 * Get all available template tags/variables for document generation
 */
const listTags = async (req, res) => {
  try {
    logger.info('Listing available template tags');
    
    // Get sample copro to extract all available fields
    const copros = await coproService.listCopropriete();
    const sampleCopro = copros.length > 0 ? copros[0] : {};
    
    // Define all available template tags organized by category
    const tags = {
      copro: [
        { tag: '{{copro.name}}', description: 'Nom de la copropriété', example: sampleCopro.Nom || sampleCopro.name || 'Résidence Les Jardins' },
        { tag: '{{copro.idCopro}}', description: 'Identifiant de la copropriété', example: sampleCopro.idCopro || 'C001' },
        { tag: '{{copro.ville}}', description: 'Ville', example: sampleCopro.ville || 'Paris' },
        { tag: '{{copro.address}}', description: 'Adresse complète', example: sampleCopro.address || '123 Rue Example' },
        { tag: '{{copro.codepostal}}', description: 'Code postal', example: sampleCopro.codepostal || '75001' },
        { tag: '{{copro.status}}', description: 'Statut', example: sampleCopro.status || 'Actif' },
        { tag: '{{copro.Offre}}', description: 'Type d\'offre', example: sampleCopro.Offre || 'Premium' },
        { tag: '{{copro.idVilogi}}', description: 'ID Vilogi', example: sampleCopro.idVilogi || '12345' }
      ],
      date: [
        { tag: '{{date.today}}', description: 'Date du jour', example: new Date().toLocaleDateString('fr-FR') },
        { tag: '{{date.today_full}}', description: 'Date complète', example: new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        { tag: '{{date.year}}', description: 'Année', example: new Date().getFullYear().toString() },
        { tag: '{{date.month}}', description: 'Mois', example: (new Date().getMonth() + 1).toString() },
        { tag: '{{date.day}}', description: 'Jour', example: new Date().getDate().toString() }
      ],
      company: [
        { tag: '{{company.name}}', description: 'Nom de l\'entreprise', example: 'Coprox' },
        { tag: '{{company.address}}', description: 'Adresse de l\'entreprise', example: 'Paris, France' },
        { tag: '{{company.phone}}', description: 'Téléphone', example: '+33 1 23 45 67 89' },
        { tag: '{{company.email}}', description: 'Email', example: 'contact@coprox.fr' }
      ]
    };
    
    // Flatten for simple list view
    const allTags = [
      ...tags.copro,
      ...tags.date,
      ...tags.company
    ];
    
    logger.info(`Returning ${allTags.length} available template tags`);
    res.json({
      success: true,
      count: allTags.length,
      tags: allTags,
      tagsByCategory: tags,
      usage: 'Use these tags in your document templates. They will be replaced with actual values during document generation.'
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
 * Get documents by category/type
 */
const getDocumentsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    logger.info('Getting documents by category', { meta: { tag } });
    
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
    
    // Filter documents by category or search term
    const filteredDocuments = allDocuments.filter(doc => {
      // Check if tag matches category
      if (doc.category === tag) return true;
      
      // Check if tag is in filename or path
      const searchText = `${doc.name} ${doc.path}`.toLowerCase();
      const tagLower = tag.toLowerCase();
      return searchText.includes(tagLower);
    });
    
    logger.info(`Found ${filteredDocuments.length} documents for: ${tag}`);
    res.json({
      success: true,
      category: tag,
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
