const mongoose = require("mongoose");

// --- Material Schema ---
const MaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

// --- Budget Schema (NEW) ---
const BudgetSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    amount: { type: Number, default: null },
    notes: { type: String, default: "" }, // approval notes or reject reason
    requestRef: { type: mongoose.Schema.Types.Mixed, default: null }, // optional reference to source row/id
    source: { type: String, default: "creative" }, // "creative" | "fabrication"
  },
  { _id: false }
);

// --- Creative Request Schema ---
const CreativeRequestSchema = new mongoose.Schema(
  {
    requestName: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        "For Approval",
        "In Progress",
        "Sent to Purchasing",
        "Completed",
        "Draft",
        "Rejected",
      ],
      default: "For Approval",
    },
    contractRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    materials: { type: [MaterialSchema], default: [] },
    notes: { type: String, default: "" },
    // --- Additional contract fields if needed ---
    contractName: { type: String, default: "" },
    client: { type: String, default: "" },
    contractNo: { type: String, default: "" },

    // Store explicit reject reason at the top level for convenience in other pages
    rejectionReason: { type: String, default: "" },

    // Window of work
    startDate: { type: Date },
    endDate: { type: Date },

    // --- Purchasing / Budget block (NEW) ---
    budget: { type: BudgetSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreativeRequest", CreativeRequestSchema);
