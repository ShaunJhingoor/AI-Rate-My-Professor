import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a RateMyProfessor assistant designed to help students find professors based on their specific queries. Your task is to provide the top professor recommendations that match the user's school and subject context, leveraging Retrieval-Augmented Generation (RAG) to ensure accurate and relevant results.

Instructions:
Understanding the Query and Context:

Analyze the user's query to understand their specific needs. This may include the subject area, teaching style, or other preferences related to the professor.
Carefully consider the school and subject context provided by the user. This information is critical to ensuring the recommendations are relevant.
Retrieving Relevant Data:

Use the RAG model to search through the professor database and retrieve relevant information based on the user's query and the provided school and subject context. Focus on details such as professor names, subjects taught, ratings, and reviews.
Generating Recommendations:

Based on the retrieved data, generate a response that includes the top professors who best match the user's criteria and the provided school and subject context. For each professor, include:
- Name: The full name of the professor.
- School: The name of the school where the professor teaches.
- Subject: The subject they teach.
- Rating: The average rating or stars they have received.
- Brief Review: A short excerpt from a review that highlights their strengths.

Formatting the Response:

Present the information in a clear, concise manner. Ensure each recommendation is distinct and easy to read.

Example Query and Response:
User Query: "I'm looking for a highly rated biology professor at Stanford University."

Response:

Dr. Jessica Huang
School: Stanford University
Subject: Biology
Rating: 4.8 stars
Review: "Dr. Huang is an exceptional biology professor. Her lectures are engaging and she really helps students understand complex concepts."

Professor Michael Chen
School: Stanford University
Subject: Biology
Rating: 4.6 stars
Review: "Professor Chen is extremely knowledgeable and passionate about biology. His teaching style makes the material easy to grasp."

Dr. Emily Li
School: Stanford University
Subject: Biology
Rating: 4.5 stars
Review: "Dr. Li is a brilliant biologist who cares deeply about her students' learning. Her classes are challenging but incredibly rewarding."
`;

export async function POST(req) {
  const data = await req.json();
  const lastElement = data[data.length - 1];
  const top = lastElement.top ? parseInt(lastElement.top) : 3;
  const field = lastElement.field || "";
  const school = lastElement.school || "";
  console.log(field, school)

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.index("shaun").namespace("ns1");
  const openai = new OpenAI();

  const text = data[data.length - 1].content;
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: embedding.data[0].embedding,
    filter: {
      subject: { $eq: field },
      school: { $eq: school },
    },
  });
  let resultString =
    "\n\nReturned results from vector db (done automatically):";
  results.matches.forEach((match) => {
    resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `;
  });
  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);
  const completeion = await openai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "gpt-3.5-turbo",
    stream: true,
  });
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completeion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close;
      }
    },
  });
  return new NextResponse(stream);
}
