import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";


export class OpenAIClient {
  private model: OpenAI;

  constructor(openAIApiKey: string) {
    this.model = new OpenAI({ openAIApiKey, temperature: 0.5, modelName: "gpt-3.5-turbo-16k" });
  }

  async complete(prompt: string) {
    return await this.model.call(prompt);
  }

  async summarize(url: string) {
    const docs = await this.getWebpageTextDocs(url);
    const summarizationChain = loadSummarizationChain(this.model, { type: "map_reduce" });

    try {
      const res = await summarizationChain.call({
        input_documents: docs,
      });
      return res.text;
    } catch (e) {
      console.error(e);
      return "";
    }
  }

  private async getWebpageTextDocs(url: string) {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: "domcontentloaded",
      },
      async evaluate(page) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const result = await page.evaluate(async () => {
          const main = document.querySelector("main");
          if (main) {
            return main.innerText;
          } else {
            return document.body.innerText;
          }
        });
        return result;
      },
    });
    return await loader.load();
  }
}
