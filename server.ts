import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/register", async (req, res) => {
    const { email, password, name, department } = req.body;
    
    // In a real app, you'd use firebase-admin here to create the user
    // and then send a real email using a service like SendGrid or Resend.
    
    console.log(`[BACKEND] Registering user: ${name} (${email}) in ${department}`);
    console.log(`[BACKEND] Sending email to ${email}...`);
    console.log(`[BACKEND] Email Content: 
      Hello ${name},
      Welcome to Atelier! Your account has been created by HR.
      Login: ${email}
      Password: ${password}
      Please change your password after your first login.`);

    // For this demo, we'll assume the client-side registration handles the actual Firebase creation
    // and this route just "sends the email" (logs it).
    
    res.json({ success: true, message: "Email sent successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
