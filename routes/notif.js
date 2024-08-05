const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const subscriptionsService = require('../models/subscription');
const dotenv = require('dotenv');

dotenv.config();

// Set VAPID keys from environment variables
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
webpush.setVapidDetails('mailto:your-email@example.com', publicVapidKey, privateVapidKey);

// Ensure the subscriptions table is created
subscriptionsService.createTable();

// Endpoint to handle subscription
router.post('/subscribe', (req, res) => {
    const { ref_num, subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const subscriptionData = {
      ref_num,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    };

    subscriptionsService.Subscription.addSubscription(subscriptionData, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Subscription saved', id: result.id });
    });
});

// Endpoint to search subscription by ref_num
router.get('/subscribe/:ref_num', (req, res) => {
  const ref_num = req.params.ref_num;

  subscriptionsService.Subscription.getSubscriptionByRefNum(ref_num, (err, subscription) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json(subscription);
  });
});

// Endpoint to send push notification
router.post('/notify/:ref_num', (req, res) => {
    const ref_num = req.params.ref_num;

    subscriptionsService.sendNotification(ref_num, (err, result) => {
        if (err) {
            return res.status(err.status).json(err);
        }
        res.status(result.status).json(result);
    });
});
module.exports = router;
