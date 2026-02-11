const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: { type: String, required: true },
    code: String,
    address: String,
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gst: String
  },
  billTo: {
    name: String,
    address: String
  },
  shipTo: {
    name: String,
    address: String
  },
  poNumber: String,
  salesRep: String,
  shipDate: Date,
  shipVia: String,
  terms: String,
  dueDate: Date,
  items: [quotationItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  gst: {
    type: Number,
    default: 10
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paid: {
    type: Number,
    default: 0
  },
  totalDue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate invoice number
quotationSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await this.constructor.findOne({
      invoiceNumber: new RegExp(`^INV${year}${month}`)
    }).sort({ invoiceNumber: -1 });
    
    let nextNumber = 1000;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.slice(-4));
      nextNumber = lastNumber + 1;
    }
    
    this.invoiceNumber = `INV${nextNumber}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);