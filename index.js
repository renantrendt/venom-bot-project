const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const venom = require('venom-bot');
const OpenAI = require('openai');

// Add a debug log to check if the env variable is being loaded
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

// Initialize OpenAI with your API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

venom
  .create({
    session: 'test-session',
    multidevice: true,
    headless: true,
    debug: true,
    logQR: true
  })
  .then((client) => {
    console.log('Bot is ready!');
    
    // Graceful shutdown handler
    process.on('SIGINT', async () => {
      console.log('Closing bot...');
      try {
        await client.close();
        console.log('Bot closed successfully!');
        process.exit(0);
      } catch (error) {
        console.error('Error closing bot:', error);
        process.exit(1);
      }
    });

    // Send initial message using number from .env
    const yourNumber = process.env.WHATSAPP_NUMBER;
    client
      .sendText(`${yourNumber}@c.us`, 'Bot is online! Send "menu" to see available commands or ask any question with "?"')
      .then(() => console.log('Initial message sent!'))
      .catch((err) => console.error('Error sending initial message:', err));
    
    // Listen to messages
    client.onMessage(async (message) => {
      // Ignore group messages, broadcast messages, and messages without body
      if (message.isGroupMsg || message.broadcast || !message.body) {
        console.log('Ignoring message:', message.isGroupMsg ? 'group message' : message.broadcast ? 'broadcast message' : 'empty message');
        return;
      }

      console.log('Message received!');
      console.log('From:', message.from);
      console.log('Content:', message.body);
      
      try {
        // Check if message contains a question mark
        if (message.body.includes('?')) {
          console.log('Question detected, asking ChatGPT...');
          
          // Get response from ChatGPT
          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: message.body }],
            model: "gpt-3.5-turbo",
          });

          // Send ChatGPT's response
          const response = completion.choices[0].message.content;
          await client.sendText(message.from, response);
          console.log('Sent ChatGPT response');
          return;
        }

        // Regular command handling
        switch(message.body.toLowerCase()) {
          case 'hello':
            client.sendText(message.from, 'Hello! How can I help you?')
              .then(() => console.log('Sent hello response'))
              .catch(err => console.error('Error sending hello:', err));
            break;
            
          case 'time':
            const time = new Date().toLocaleTimeString();
            client.sendText(message.from, `Current time is: ${time}`)
              .then(() => console.log('Sent time response'))
              .catch(err => console.error('Error sending time:', err));
            break;
            
          case 'menu':
            const menu = `
Available commands:
- hello: Get a greeting
- time: Get current time
- menu: Show this menu
- ping: Test bot response
- Or ask any question with "?" to get a response from ChatGPT
            `;
            client.sendText(message.from, menu)
              .then(() => console.log('Sent menu response'))
              .catch(err => console.error('Error sending menu:', err));
            break;
            
          case 'ping':
            client.sendText(message.from, 'Pong! 🏓')
              .then(() => console.log('Sent pong response'))
              .catch(err => console.error('Error sending pong:', err));
            break;
            
          default:
            client.sendText(message.from, `You said: ${message.body}`)
              .then(() => console.log('Sent echo response'))
              .catch(err => console.error('Error sending echo:', err));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        client.sendText(message.from, 'Sorry, there was an error processing your message.');
      }
    });

    console.log('Message listener set up successfully');
  })
  .catch((error) => {
    console.error('Error:', error);
  });