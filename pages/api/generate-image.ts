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
    const inputDir = path.resolve(
      __dirname,
      "../../../../assets/images/input/"
    );
    const outputDir = path.resolve(
      __dirname,
      "../../../../assets/images/output/"
    );

    const data: { fields: any; files: any } = await new Promise(
      (resolve, reject) => {
        const form = new formidable.IncomingForm();

        form.parse(req, (err: any, fields: any, files: any) => {
          if (err) reject({ err });
          resolve({ fields, files });
        });
      }
    );

    let { name, settings } = data.fields;
    const { image } = data.files;

    const textBuffer1 = Buffer.from(`
       <svg height="80" fill="blue" width="1000">
        <style>
        .title { fill: #feeadd; font-size: 60px;}
        </style>
        <text x="0" y="90%" text-anchor="left" class="title">${name}</text>
      </svg>
      `);

    const textBuffer2 = Buffer.from(`
       <svg height="80" fill="blue"  width="1000">
        <style>
        .title { fill: #ff0402; font-size: 45px;}
        </style>
        <text x="0" y="90%" text-anchor="left" class="title">CONFIRMED</text>
      </svg>
      `);

    let imageF = await sharp(image.filepath)
      .resize(1184, 2120, { fit: "cover" })
      .toFormat("png")
      .toBuffer();

    const imageBuf = await sharp(`${inputDir}/template.png`)
      .composite([
        {
          input: imageF,
          top: 504,
          left: 186,
        },
        {
          input: textBuffer1,
          top: 1873,
          left: 1528,
          blend: "over",
        },
        {
          input: textBuffer2,
          top: 1940,
          left: 1558,
          blend: "over",
        },
      ])
      .toBuffer();

    // .toFile(`${outputDir}/image.png`);

    res.setHeader("Content-Type", "image/jpg");
    res.send(imageBuf);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "error" });
  }
}
