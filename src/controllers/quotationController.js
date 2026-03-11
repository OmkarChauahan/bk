const Quotation = require('../models/Quotation');
const Service = require('../models/Service');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// Get all quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: error.message });
  }
};

// Get single quotation
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create quotation
exports.createQuotation = async (req, res) => {
  try {
    const { customer, billTo, shipTo, poNumber, salesRep, shipDate, shipVia, terms, dueDate, items, gst, shipping, paid, notes } = req.body;

    let subtotal = 0;
    const processedItems = items.map(item => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return { ...item, amount };
    });

    const gstAmount = (subtotal * (gst || 10)) / 100;
    const total = subtotal + gstAmount + (shipping || 0);
    const totalDue = total - (paid || 0);

    const quotation = new Quotation({
      customer, billTo, shipTo, poNumber, salesRep, shipDate, shipVia,
      terms, dueDate, items: processedItems, subtotal, gst: gst || 10,
      gstAmount, shipping: shipping || 0, total, paid: paid || 0,
      totalDue, notes, createdBy: req.user._id
    });

    await quotation.save();

    res.status(201).json({ success: true, message: 'Quotation created successfully', data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create quotation', error: error.message });
  }
};

// Update quotation
exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const { customer, billTo, shipTo, poNumber, salesRep, shipDate, shipVia, terms, dueDate, items, gst, shipping, paid, notes, status } = req.body;

    if (items) {
      let subtotal = 0;
      const processedItems = items.map(item => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return { ...item, amount };
      });
      const gstAmount = (subtotal * (gst || quotation.gst)) / 100;
      const total = subtotal + gstAmount + (shipping !== undefined ? shipping : quotation.shipping);
      const totalDue = total - (paid !== undefined ? paid : quotation.paid);
      quotation.items = processedItems;
      quotation.subtotal = subtotal;
      quotation.gstAmount = gstAmount;
      quotation.total = total;
      quotation.totalDue = totalDue;
    }

    if (customer)            quotation.customer  = customer;
    if (billTo)              quotation.billTo    = billTo;
    if (shipTo)              quotation.shipTo    = shipTo;
    if (poNumber !== undefined)  quotation.poNumber  = poNumber;
    if (salesRep !== undefined)  quotation.salesRep  = salesRep;
    if (shipDate !== undefined)  quotation.shipDate  = shipDate;
    if (shipVia !== undefined)   quotation.shipVia   = shipVia;
    if (terms !== undefined)     quotation.terms     = terms;
    if (dueDate !== undefined)   quotation.dueDate   = dueDate;
    if (gst !== undefined)       quotation.gst       = gst;
    if (shipping !== undefined)  quotation.shipping  = shipping;
    if (paid !== undefined)      quotation.paid      = paid;
    if (notes !== undefined)     quotation.notes     = notes;
    if (status)                  quotation.status    = status;

    await quotation.save();

    res.json({ success: true, message: 'Quotation updated successfully', data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete quotation
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ FIXED: Generate PDF — now awaits the promise properly
exports.generatePDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // ✅ await the PDF — prevents write-after-end crash
    await generateInvoicePDF(quotation, res);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    // ✅ Only send error response if headers not already sent (PDF streaming started)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// Get stats
exports.getQuotationStats = async (req, res) => {
  try {
    const total   = await Quotation.countDocuments();
    const draft   = await Quotation.countDocuments({ status: 'Draft' });
    const sent    = await Quotation.countDocuments({ status: 'Sent' });
    const paid    = await Quotation.countDocuments({ status: 'Paid' });
    const overdue = await Quotation.countDocuments({ status: 'Overdue' });

    const totalValueResult = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const paidValueResult = await Quotation.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      data: {
        total, draft, sent, paid, overdue,
        totalValue: totalValueResult[0]?.total || 0,
        paidValue:  paidValueResult[0]?.total  || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};