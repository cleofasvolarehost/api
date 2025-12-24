const MercadoPagoProvider = require('../providers/MercadoPagoProvider');
const { supabase } = require('../config/supabase');
const IuguService = require('../services/IuguService');

const mpProvider = new MercadoPagoProvider();

class SubscriptionController {
  
  static async checkout(req, res) {
    try {
      const { planId, paymentMethod, userId } = req.body; // userId usually from Auth middleware

      if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
      }

      // 1. Validate Plan Price (Server-side)
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      // 2. Create Payment/Preference
      let result;
      const userEmail = req.user?.email || 'test_user@test.com'; // In real app, get from DB or Auth token

      if (paymentMethod === 'pix') {
        result = await mpProvider.createPixPayment({
          amount: plan.price,
          userId: userId,
          email: userEmail,
          description: `Subscription: ${plan.name}`,
          planId: plan.id
        });
      } else {
        // Default to Preference (Checkout Pro) for Card/Boleto
        result = await mpProvider.createPreference({
          title: `Subscription: ${plan.name}`,
          price: plan.price,
          userId: userId,
          email: userEmail,
          planId: plan.id
        });
      }

      return res.json(result);

    } catch (error) {
      console.error('Checkout Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async renew(req, res) {
    try {
      const { userId, monthsToAdd = 1 } = req.body;

      // 1. Get User's current subscription/plan
      const { data: user, error: userError } = await supabase
        .from('usuarios') // Assuming 'usuarios' table has plan info or a relation
        .select('*, plans(*)') // Adjust based on actual schema
        .eq('id', userId)
        .single();

      if (userError || !user || !user.plans) {
         // Fallback if relation not clear, fetch latest subscription
         return res.status(400).json({ error: 'Active subscription not found' });
      }

      const plan = user.plans;
      const totalAmount = plan.price * monthsToAdd;

      // 2. Check for saved card (Placeholder logic)
      // In a real scenario, check `user.mp_customer_id` and default card
      const hasSavedCard = false; 

      if (hasSavedCard) {
        // Logic to charge saved card via MP Payment API (using token)
        // const charge = await mpProvider.chargeCustomer(...)
        // return res.json(charge);
        return res.status(501).json({ message: "Saved card renewal not implemented yet" });
      } 
      
      // 3. Fallback: Generate Pix for renewal
      const result = await mpProvider.createPixPayment({
        amount: totalAmount,
        userId: userId,
        email: user.email,
        description: `Renewal: ${plan.name} (${monthsToAdd} months)`,
        planId: plan.id
      });

      // Crucial: Do NOT update expiration date yet. Wait for Webhook.
      return res.json(result);

    } catch (error) {
      console.error('Renew Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async cancel(req, res) {
    try {
      const { establishment_id } = req.body;
      const userId = req.user.id;

      if (!establishment_id) {
        return res.status(400).json({ success: false, message: 'Establishment ID required' });
      }

      // Check ownership or super_admin
      const { data: user } = await supabase.from('usuarios').select('tipo').eq('id', userId).single();
      const isSuperAdmin = user?.tipo === 'super_admin';

      const { data: est } = await supabase.from('establishments').select('owner_id').eq('id', establishment_id).single();
      const isOwner = est?.owner_id === userId;

      if (!isSuperAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: 'Permission denied' });
      }

      // Find active subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('establishment_id', establishment_id)
        .in('status', ['active', 'past_due'])
        .single();

      if (!sub) {
        return res.status(404).json({ success: false, message: 'No active subscription found' });
      }

      // Cancel in Iugu if iugu_subscription_id exists
      if (sub.iugu_subscription_id) {
        const iugu = new IuguService();
        // Assuming delete/suspend method exists or just marking as canceled locally
        // Iugu API allows suspending subscription
        try {
            await fetch(`https://api.iugu.com/v1/subscriptions/${sub.iugu_subscription_id}/suspend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${process.env.IUGU_API_TOKEN}:`).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch(e) {
            console.error('Error suspending in Iugu', e);
        }
      }

      // Update local status
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'canceled', 
          canceled_at: new Date().toISOString() 
          // Do not clear current_period_end to allow access until then
        })
        .eq('id', sub.id);

      if (error) throw error;

      return res.json({ success: true });

    } catch (error) {
      console.error('Cancel Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = SubscriptionController;
