import { Request, Result, Notification } from './types.js';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const request: Request = req.body;
  const response: Result = ;
  res.json(response);
});

app.listen(3000, () => {
  console.log('Hello World MCP Server started');
  console.log('Waiting for JSON-RPC messages on port 3000...');
});