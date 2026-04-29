import "dotenv/config";
import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({ input, output });

async function main() {
    console.log("Assistente personale avviato. Scrivi 'exit' per uscire.\n");

    while (true) {
        const question = await rl.question("> ");

        if (question.toLowerCase() === "exit") {
            rl.close();
            break;
        }

        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: [
                {
                    role: "system",
                    content:
                        "Sei un assistente personale. Rispondi in modo pratico, chiaro e sintetico.",
                },
                {
                    role: "user",
                    content: question,
                },
            ],
        });

        console.log("\n" + response.output_text + "\n");
    }
}

main().catch(console.error);