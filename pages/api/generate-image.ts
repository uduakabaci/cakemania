// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import sharp from "sharp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const inputDir = path.resolve(__dirname, "../../../../assets/images/input/");
  const outputDir = path.resolve(
    __dirname,
    "../../../../assets/images/output/"
  );

  const maxCropHeight = 700;
  const maxCropWidth = 700;

  const metadata = await sharp(`${inputDir}/udee.jpeg`).metadata();
  const { height = maxCropHeight, width = maxCropWidth } = metadata;
  const cropHeight = height > maxCropHeight ? maxCropHeight : height;
  const cropWidth = width > maxCropWidth ? maxCropWidth : width;

  const rect = Buffer.from(
    '<svg><rect x="0" y="0" width="700" height="700" rx="550" ry="550" fill="#FF0000"/></svg>'
  );

  const text = "Uduakabaci Udofe";

  const textBuffer = Buffer.from(`
     <svg width="541" height="58">
      <style>
      .title { fill: #fff; font-size: 60px; font-weight: bold;}
      </style>
      <text x="50%" y="70%" text-anchor="middle" class="title">${text}</text>
    </svg>
    `);

  const userCrop = await sharp(`${inputDir}/udee.jpeg`)
    .extract({ height: cropHeight, width: cropWidth, left: 0, top: 0 })
    .composite([
      {
        input: rect,
        top: 0,
        left: 0,
        blend: "dest-in",
      },
    ])
    .toFormat("png")
    .toBuffer();

  await sharp(`${inputDir}/TEWZ-template.jpg`)
    .composite([
      {
        input: userCrop,
        top: 790,
        left: 829,
      },
      {
        input: Buffer.from(
          '<svg><rect x="0" y="0" width="541" height="58" fill="#000000"/></svg>'
        ),
        top: 1889,
        left: 642,
      },
      {
        input: textBuffer,
        top: 1889,
        left: 642,
        blend: "over",
      },
    ])
    .toFile(`${outputDir}/504.png`);

  res.status(200).json({ metadata: 5 });
}
