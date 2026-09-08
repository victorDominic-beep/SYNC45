// Placeholder server entry point
import "dotenv/config";
import app from "./app";


const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  try {
    app.listen(PORT, () => {
      console.log(`
==========================================
 Sync45 Server Started Successfully
==========================================
Environment : ${process.env.NODE_ENV}
Port        : ${PORT}
==========================================
      `);
    });
  } catch (error) {
    console.error("Failed to start Sync45 server.", error);
    process.exit(1);
  }
}

startServer();