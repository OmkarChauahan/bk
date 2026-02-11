// backend/src/routes/quotationRoutes.js
const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Service = require('../models/Service');
const { protect, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// Test route (no auth)
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Quotation routes are working!' 
  });
});

// Protected routes - require authentication
router.use(protect);

// Get quotation statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await Quotation.countDocuments();
    const draft = await Quotation.countDocuments({ status: 'Draft' });
    const sent = await Quotation.countDocuments({ status: 'Sent' });
    const accepted = await Quotation.countDocuments({ status: 'Accepted' });
    const rejected = await Quotation.countDocuments({ status: 'Rejected' });
    const expired = await Quotation.countDocuments({ status: 'Expired' });

    const totalValueResult = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const acceptedValueResult = await Quotation.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        draft,
        sent,
        accepted,
        rejected,
        expired,
        totalValue: totalValueResult[0]?.total || 0,
        acceptedValue: acceptedValueResult[0]?.total || 0,
        conversionRate: total > 0 ? ((accepted / total) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('createdBy', 'name email')
      .populate('items.service', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
});

// Get single quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.service');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new quotation
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { customer, items, validUntil, notes, terms } = req.body;

    if (!customer || !items || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer, items, and valid until date'
      });
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processedItems = await Promise.all(items.map(async (item) => {
      const service = await Service.findById(item.service);
      if (!service) {
        throw new Error(`Service not found: ${item.service}`);
      }

      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = (itemSubtotal * (item.discount || 0)) / 100;
      const taxableAmount = itemSubtotal - discountAmount;
      const taxAmount = (taxableAmount * (item.tax || 18)) / 100;
      const itemTotal = taxableAmount + taxAmount;

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        service: item.service,
        serviceName: service.name,
        description: item.description || service.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 18,
        amount: itemTotal
      };
    }));

    const grandTotal = subtotal - totalDiscount + totalTax;

    const quotation = new Quotation({
      customer,
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      validUntil,
      notes,
      terms,
      createdBy: req.user._id,
      status: 'Draft'
    });

    await quotation.save();

    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate('createdBy', 'name email')
      .populate('items.service');

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: populatedQuotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: error.message
    });
  }
});

// Update quotation
router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (['Accepted', 'Rejected'].includes(quotation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit accepted or rejected quotations'
      });
    }

    const { customer, items, validUntil, notes, terms } = req.body;

    if (items) {
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      const processedItems = await Promise.all(items.map(async (item) => {
        const service = await Service.findById(item.service);
        if (!service) {
          throw new Error(`Service not found: ${item.service}`);
        }

        const itemSubtotal = item.quantity * item.unitPrice;
        const discountAmount = (itemSubtotal * (item.discount || 0)) / 100;
        const taxableAmount = itemSubtotal - discountAmount;
        const taxAmount = (taxableAmount * (item.tax || 18)) / 100;
        const itemTotal = taxableAmount + taxAmount;

        subtotal += itemSubtotal;
        totalDiscount += discountAmount;
        totalTax += taxAmount;

        return {
          service: item.service,
          serviceName: service.name,
          description: item.description || service.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tax: item.tax || 18,
          amount: itemTotal
        };
      }));

      quotation.items = processedItems;
      quotation.subtotal = subtotal;
      quotation.totalDiscount = totalDiscount;
      quotation.totalTax = totalTax;
      quotation.grandTotal = subtotal - totalDiscount + totalTax;
    }

    if (customer) quotation.customer = customer;
    if (validUntil) quotation.validUntil = validUntil;
    if (notes !== undefined) quotation.notes = notes;
    if (terms !== undefined) quotation.terms = terms;

    await quotation.save();

    const updatedQuotation = await Quotation.findById(quotation._id)
      .populate('createdBy', 'name email')
      .populate('items.service');

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      data: updatedQuotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete quotation
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status === 'Accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete accepted quotations'
      });
    }

    await quotation.deleteOne();

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update quotation status
router.patch('/:id/status', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    quotation.status = status;

    if (status === 'Sent') quotation.sentAt = new Date();
    if (status === 'Accepted') quotation.acceptedAt = new Date();
    if (status === 'Rejected') quotation.rejectedAt = new Date();

    await quotation.save();

    res.json({
      success: true,
      message: `Quotation ${status.toLowerCase()} successfully`,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.service');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation-${quotation.quotationNumber}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('QUOTATION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('WorkHub Solutions');
    doc.fontSize(10).text(`Quotation #: ${quotation.quotationNumber}`);
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}`);
    doc.moveDown();
    
    // Customer
    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(quotation.customer.name);
    doc.text(quotation.customer.email);
    doc.text(quotation.customer.phone);
    doc.moveDown();
    
    // Items
    quotation.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.serviceName} - ₹${item.amount.toFixed(2)}`);
    });
    
    doc.moveDown();
    doc.fontSize(12).text(`Total: ₹${quotation.grandTotal.toFixed(2)}`, { align: 'right' });
    
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send quotation via email
router.post('/:id/send', authorize('admin', 'manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    quotation.status = 'Sent';
    quotation.sentAt = new Date();
    await quotation.save();

    res.json({
      success: true,
      message: 'Quotation sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;