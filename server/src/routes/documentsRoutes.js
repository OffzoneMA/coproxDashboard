const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');

// Health check
router.get('/health', documentsController.healthCheck);

// Get all documents
router.get('/list', documentsController.listDocuments);

// Get all tags/categories
router.get('/tags', documentsController.listTags);

// Get documents by tag
router.get('/tag/:tag(*)', documentsController.getDocumentsByTag);

// Download a specific document
router.get('/download/:filepath(*)', documentsController.downloadDocument);

module.exports = router;
