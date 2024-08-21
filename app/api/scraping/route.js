// name : div class = NameTitle__Name-dowf0z-0 cfjPUG
// rating: div class = "RatingValue__Numerator-qw8sqy-2 liyUjw"
// subject: div class = NameTitle__Title-dowf0z-1 iLYGwn
// reviews: div class = Comments__StyledComments-dzzyvm-0 gRjWel
// classes: div class =  RatingHeader__StyledClass-sc-1dlkqw1-3 eXfReS
// /pages/api/scraping.js
//https://www.ratemyprofessors.com/professor/475528
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.Index('shaun'); 

async function processProfessorPage(url) {
  try {
    console.log(`Fetching data from URL: ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const professorName = $('div.NameTitle__Name-dowf0z-0.cfjPUG').text().trim();
    const rating = $('div.RatingValue__Numerator-qw8sqy-2.liyUjw').text().trim();
    const subject = $('div.NameTitle__Title-dowf0z-1.iLYGwn').text().trim();
    const review = $('div.Comments__StyledComments-dzzyvm-0.gRjWel').map((i, el) => $(el).text().trim()).get().join(' ');

    const stars = parseInt(rating)
    console.log(`Professor Name: ${professorName}`);
    console.log(`Rating: ${rating}`);
    console.log(`Subject: ${subject}`);
    console.log(`Review: ${review}`);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: review,
      encoding_format: "float"
    });

    const embedding = embeddingResponse.data[0].embedding;

    console.log(`Embedding: ${embedding}`);

    return [{
      values: embedding,
      id: professorName,
      metadata: {
        stars,
        subject,
        review,
      },
    }];
  } catch (error) {
    console.error(`Error processing URL: ${url}`, error);
    throw new Error(`Failed to process the URL: ${url}`);
  }
}

// Export a named function for the POST method
export async function POST(req, res) {
  const { url } = await req.json();

  console.log(`Received POST request with URL: ${url}`);

  try {
    const data = await processProfessorPage(url);

    console.log(`Data to be upserted into Pinecone:`, data);

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array.');
    }

    await index.namespace('ns1').upsert(data)

    console.log(`Successfully upserted data into Pinecone`);

    return new Response(JSON.stringify({ message: `Scraping successful! Professor: ${data[0].id}`, success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error(`Error during POST request processing:`, error);
    return new Response(JSON.stringify({ message: `Scraping failed!`, success: false }), {
      status: 500,
    });
  }
}
