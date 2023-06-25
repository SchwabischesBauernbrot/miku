import fs, { readFileSync } from 'fs';
import { Express, Request, Response } from "express";
import { BotConfig, MikuCard, extractCardFromBuffer, hashBase64URI, extractMikuCardImages, validateMikuCard } from "../../../../packages/bot-validator/dist";
import config from '../config';
const Hash = require('ipfs-only-hash');

// async function getScenariosTriggerEmbeddingsHash (card: MikuCard): Promise<string> {
//   const { scenarios } = card.data.extensions.mikugg;

//   if (scenarios.length < 2) {
//     return '';
//   }
  
//   return await Hash.of(
//     scenarios
//       .map((scenario) => scenario.trigger_suggestion_similarity)
//       .sort()
//   );
// }

// hashes the image, store is it IMG_PATH and returns the hash
const addImage = async (hash: string, base64URL: string): Promise<string> => {
  const imgPath = `${config.IMG_PATH}/${hash}`;
  if (!fs.existsSync(imgPath)) {
    const imgBuffer = Buffer.from(base64URL.split(',')[1], 'base64');
    fs.writeFileSync(imgPath, imgBuffer);
  }
  return hash;
}

// Registers a bot configuration
export default async function addBot(req: Request, res: Response) {
  try {
    if (!req.file?.path) throw 'file not found';
    if (!req.file?.originalname.endsWith('.png')) throw 'Invalid file type, only .png is supported';

    const buffer = readFileSync(req.file.path);
    const mikuCard = (await extractCardFromBuffer(buffer)) as MikuCard;
    
    if(mikuCard?.spec !== 'chara_card_v2') throw 'Invalid file type, only chara_card_v2 is supported';
    if(!mikuCard?.data?.extensions?.mikugg?.scenarios?.length) throw 'Invalid card: extension.mikugg.scenarios not found or is empty';
    const errors = validateMikuCard(mikuCard);
    if (errors.length) throw errors.join('\n');
    const {card: _extractedMikuCard, images } = await extractMikuCardImages(mikuCard);
    for (const [key, value] of images.entries()) {
      await addImage(key, value);
    }
    const _extractedMikuCardHash = await Hash.of(JSON.stringify(_extractedMikuCard));
    const cardPath = `${config.BOT_PATH}/${_extractedMikuCardHash}`;
    if (fs.existsSync(cardPath)) {
      throw 'Bot already exists';
    }
    fs.writeFileSync(cardPath, JSON.stringify(_extractedMikuCard), 'utf-8');

    res.redirect('/');
    res.end();
    
  } catch (err) {
    res.status(400).send(`
      <h1>Failed to add bot</h1>
      <p>${err}</p>
      <a href="/">Go back</a>
    `);
    return;
  }
  
}
