const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Download PDF receipt (Owners can access their own, Admins can access all)
router.get('/:id/download', receiptController.downloadReceipt);

module.exports = router;
