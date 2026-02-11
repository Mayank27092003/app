import express from "express";
import Stripe from "stripe";

const app = express();
app.use(express.json());

// ✅ Initialize Stripe with your secret key
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER"
);

// --- STEP 1: Create connected account ---
app.post("/create-connected-account", async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ Step 1: Create Express connected account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },

    });

    // ✅ Step 2: Create onboarding link for the account
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://your-app.com/reauth",
      return_url: "https://your-app.com/onboarding-success",
      type: "account_onboarding",
    });

    // ✅ Step 3: Return both IDs and onboarding link
    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(400).json({ error: err.message });
  }
});

// --- STEP 2: Create a payment intent (customer pays) ---
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
      capture_method: "manual", // hold funds first
      transfer_group: orderId,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// --- STEP 3: Capture the payment (after service done) ---
app.post("/capture-payment", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const captured = await stripe.paymentIntents.capture(paymentIntentId);
    res.json({ success: true, captured });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// --- STEP 4: Transfer funds to connected account ---
app.post("/transfer-funds", async (req, res) => {
  try {
    const { amount, currency, destinationAccountId, orderId } = req.body;

    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: destinationAccountId,
      transfer_group: orderId,
    });

    res.json({ success: true, transfer });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.get("/get-balance/:connectedAccountId", async (req, res) => {
  try {
    const { connectedAccountId } = req.params;

    // 🧾 Fetch the connected account's balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    });

    // 💰 Extract only available and pending balances
    const availableBalance = balance.available.map((b) => ({
      amount: b.amount,
      currency: b.currency,
    }));

    const pendingBalance = balance.pending.map((b) => ({
      amount: b.amount,
      currency: b.currency,
    }));

    res.json({
      success: true,
      availableBalance,
      pendingBalance,
      fullResponse: balance, // optional, remove if not needed
    });
  } catch (err) {
    console.error("❌ Error fetching balance:", err);
    res.status(400).json({ error: err.message });
  }
});

app.post("/withdraw-funds", async (req, res) => {
  try {
    const { connectedAccountId, amount, currency } = req.body;

    // ✅ Create a payout (withdraw from Stripe balance → user's bank)
    const payout = await stripe.payouts.create(
      {
        amount, // in cents (e.g. $10.00 = 1000)
        currency, // e.g. "usd"
      },
      {
        stripeAccount: connectedAccountId, // 🔑 Specify connected account
      }
    );

    res.json({
      success: true,
      message: "Withdrawal initiated successfully",
      payout,
    });
  } catch (err) {
    console.error("❌ Withdrawal error:", err);
    res.status(400).json({ error: err.message });
  }
});


// --- STEP 5: Webhook listener (optional but recommended) ---
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const event = req.body;

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("Payment succeeded:", event.data.object.id);
      break;
    case "transfer.created":
      console.log("Transfer created:", event.data.object.id);
      break;
  }

  res.json({ received: true });
});
app.post("/add-bank-account", async (req, res) => {
  try {
    const {
      accountId,
      accountNumber,
      routingNumber,
      accountHolderName,
      currency,
      country,
    } = req.body;

    // ✅ Create or replace existing external bank account
    //   const bankAccount = await stripe.accounts.createExternalAccount(
    //     accountId,
    //     {
    //       external_account: {
    //         object: "bank_account",
    //         country: country || "US",
    //         currency: currency || "usd",
    //         account_number: accountNumber,
    //         routing_number: routingNumber,
    //         account_holder_name: accountHolderName,
    //         account_holder_type: "individual", // or "company"
    //       },
    //     }
    //   );
    const account = await stripe.accounts.retrieve(accountId);

    const linkType = account.details_submitted
      ? "account_update"
      : "account_onboarding";

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: "https://your-app.com/reauth",
      return_url: "https://your-app.com/onboarding-success",
      type: "account_onboarding",
    });

    res.json({
      success: true,
      message: "Bank account added successfully",
      //   bankAccount,
      accountLink
    });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(400).json({ error: err.message });
  }
});
app.get("/bank-accounts/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    // ✅ Fetch all external accounts (bank accounts or debit cards)
    const accounts = await stripe.accounts.listExternalAccounts(accountId, {
      // object: "bank_account", // you can also use "card" if needed
      limit: 10, // optional

    });

    // Map simplified response for frontend
    const bankAccounts = accounts.data.map(acc => ({
      id: acc.id,
      bank_name: acc.bank_name,
      last4: acc.last4,
      currency: acc.currency,
      country: acc.country,
      status: acc.status,
      default_for_currency: acc.default_for_currency,
      account_holder_name: acc.account_holder_name,
    }));

    res.json({
      success: true,
      count: bankAccounts.length,
      bankAccounts: accounts.data,
    });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(400).json({ error: err.message });
  }
});
// --- Start server ---
app.listen(4000, () =>
  console.log("🚀 Stripe escrow flow server running on port 4000")
);
