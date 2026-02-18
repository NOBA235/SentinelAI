
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = "ProtectAI/deberta-v3-base-prompt-injection";

app.post("/analyze", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    const result = await response.json();

    let risk = 0;
    let verdict = "safe";

    if (Array.isArray(result) && result[0]) {
      const score = result[0][0].score;
      risk = Math.round(score * 100);
      verdict = risk > 60 ? "malicious" : "safe";
    }

    res.json({
      risk,
      verdict,
      layers: {
        heuristic: risk > 50 ? "flagged" : "clear",
        classifier: verdict,
        behavioral: risk > 40 ? "suspicious" : "normal",
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(5000, () => {
  console.log("SentinelAI backend running on http://localhost:5000");
});
