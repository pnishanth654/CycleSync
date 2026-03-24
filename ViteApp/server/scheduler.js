const cron = require('node-cron');
const db = require('./database');
const { sendMail } = require('./mailer');
function daysBetween(d1, d2) {
  return Math.floor((new Date(d2) - new Date(d1)) / 86400000);
}

const sendReminder = async (user, reminder) => {
  try {
    await sendMail({
      to: user.email,
      subject: `CycleSync Reminder: ${reminder.label} ${reminder.icon}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #fff0f3; padding: 40px 20px; text-align: center;">
          <div style="background: white; max-width: 480px; margin: 0 auto; padding: 40px 24px; border-radius: 24px; box-shadow: 0 8px 24px rgba(232,121,160,0.15);">
            <div style="font-size: 48px; margin-bottom: 12px;">${reminder.icon}</div>
            <h1 style="color: #e879a0; margin: 0 0 8px; font-size: 26px;">CycleSync</h1>
            <p style="color: #9b6b8a; font-size: 16px; margin: 0 auto 10px;">
              Here is your requested gentle reminder:
            </p>
            <div style="background: #fdf2f8; padding: 24px; border-radius: 16px; display: inline-block; border: 2px solid #fce7f3; margin-top: 10px;">
              <h2 style="margin: 0; font-size: 24px; color: #a855f7; font-weight: 700;">${reminder.label}</h2>
            </div>
            <p style="color: #d1b8c8; font-size: 13px; margin-top: 30px;">
              You can manage these reminders anytime in your CycleSync App settings.
            </p>
          </div>
        </div>
      `
    });
    console.log(`[SCHEDULER] Reminder sent to ${user.email}: ${reminder.label}`);
  } catch (err) {
    console.error(`[SCHEDULER] Failed to send reminder to ${user.email}`, err);
  }
};

const evaluateReminders = () => {
  console.log('[SCHEDULER] Evaluating user reminders...');
  const today = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours(); 
  
  db.all('SELECT * FROM users', [], (err, users) => {
    if (err || !users) return;
    
    users.forEach(user => {
      if (!user.reminders) return;
      let userReminders = [];
      try { userReminders = JSON.parse(user.reminders); } catch (e) { return; }
      
      db.all(`SELECT * FROM logs WHERE user_id = ? ORDER BY date ASC`, [user.id], (err, logs) => {
        const periods = (logs || []).filter(e => e.flowLevel > 0).map(e => e.date);
        let cycleStart = null;
        let cycleLength = 28;
        
        if (periods.length > 0) {
          cycleStart = periods[periods.length - 1];
          if (periods.length > 1) {
             const prevs = periods.slice(-5, -1);
             let total = 0;
             for (let i = 1; i < prevs.length; i++) total += daysBetween(prevs[i - 1], prevs[i]);
             if (prevs.length > 1) cycleLength = Math.round(total / (prevs.length - 1));
          }
        }
        
        const dayOfCycle = cycleStart ? daysBetween(cycleStart, today) + 1 : 1;
        let updated = false;
        
        userReminders.forEach(r => {
          if (!r.active || r.lastSent === today) return;
          
          let shouldSend = false;
          
          if (r.id === 1) {
            if (currentHour >= 20) shouldSend = true; // 8:00 PM
          } else if (r.id === 2 && cycleStart) {
            const daysUntilPeriod = cycleLength - dayOfCycle;
            if (daysUntilPeriod === 2) shouldSend = true;
          } else if (r.id === 3 && cycleStart) {
            if (dayOfCycle === 12) shouldSend = true;
          } else if (r.id === 4 && cycleStart) {
            const hasPeriod = (logs || []).some(l => l.date === today && l.flowLevel > 0);
            if (hasPeriod || (dayOfCycle >= 1 && dayOfCycle <= 5)) shouldSend = true; 
          } else if (r.id === 5) {
             if (currentHour >= 12) shouldSend = true; // Trigger daily around noon since sending every 3h repeatedly is risky without hour-tracking
          }
          
          if (shouldSend) {
            sendReminder(user, r);
            r.lastSent = today; // Protect against duplicated sends today
            updated = true;
          }
        });
        
        if (updated) {
          db.run(`UPDATE users SET reminders = ? WHERE id = ?`, [JSON.stringify(userReminders), user.id]);
        }
      });
    });
  });
};

// Run automatically every hour
cron.schedule('0 * * * *', () => {
  evaluateReminders();
});

module.exports = {
  triggerTest: evaluateReminders
};
