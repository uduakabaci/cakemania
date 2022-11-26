// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import sharp from "sharp";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method != "POST")
      return { message: "Method not allowed", status: false };
    const inputDir = path.resolve(process.cwd(), "assets/images/input/");

    const data: { fields: any; files: any } = await new Promise(
      (resolve, reject) => {
        const form = new formidable.IncomingForm();

        form.parse(req, (err: any, fields: any, files: any) => {
          if (err) reject({ err });
          resolve({ fields, files });
        });
      }
    );

    let { name, ticket } = data.fields;
    const { image } = data.files;

    ticket = JSON.parse(ticket || "null");

    if (!/success/gi.test(ticket?.status)) throw new Error("Invalid ticket");

    const textBuffer1 = Buffer.from(`
       <svg height="80" fill="blue" width="1000">
        <style>
        .title { fill: #d8b98c; font-size: 90px; font-weight: bold; font-family: cursive; transform: skewX(-8deg);}
        </style>
        <text x="10" y="90%" text-anchor="left" class="title">${name}</text>
      </svg>
      `);
    let imageF = await sharp(image.filepath)
      .resize(1184, 2120, { fit: "cover" })
      .toFormat("png")
      .toBuffer();

    const confirmedImage = await sharp(`${inputDir}/confirmed.png`)
      .toFormat("png")
      .toBuffer();

    const imageBuf = await sharp(`${inputDir}/template.webp`)
      .composite([
        {
          input: imageF,
          top: 528,
          left: 210,
        },
        {
          input: confirmedImage,
          top: 454,
          left: -312,
        },
        {
          input: textBuffer1,
          top: 1800,
          left: 1828,
          blend: "over",
        },
      ])
      .toFormat("jpeg")
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuf);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "error" });
  }
}
