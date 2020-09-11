'use strict';
const https = require('https'),
    Stream = require('stream').Transform,
    fs = require('fs'),
    jimp = require('jimp'),
    AWS = require('aws-sdk');
const rekog = new AWS.Rekognition();

const discordHost = 'https://cdn.discordapp.com';
const host = 'cdn.discordapp.com';


module.exports.ocr = (event, context, callback) => {
    const {body} = event;
    console.log('event', body);
    const {url, id} = JSON.parse(body);
    //const url = 'https://cdn.discordapp.com/attachments/309852338644975616/712022639857762324/unknown.png';
    const path = url.replace(discordHost, '');
    https.request(
        {
            host,
            path,
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            json: true
        },
        (response) => {
            const data = new Stream();
            response.on('data', (chunk) => {
                data.push(chunk);
            });
            response.on('end', async () => {
                const stage = 0;
                const saveDir = stage === 1 ? `./` : `/tmp/`;
                const fileDir = saveDir + id + '.png';
                const croppedImageDir = saveDir + id;
                fs.writeFileSync(fileDir, data.read());
                const image1 = await jimp.read(fileDir);
                const image2 = await jimp.read(fileDir);
                // kda visible 330, 340, 650, 470
                const blot = await jimp.read('./blot.png');
                const x = 330, y = 350, w = 450, h = 520;
                const croppedNames = image1
                    .crop(x, y, w, h)
                    .composite(blot, 300, 0)
                    .composite(blot, 330, 0)
                    .composite(blot, 360, 0)
                    .composite(blot, 390, 0)
                    .composite(blot, 420, 0)
                    .write(croppedImageDir + '-crop-names.png');
                const b64croppedNames = await croppedNames.getBufferAsync(jimp.MIME_PNG);

                const croppedScores = image2
                    .crop(x, y, w, h)
                    .composite(blot, 0, 0)
                    .composite(blot, 30, 0)
                    .composite(blot, 60, 0)
                    .composite(blot, 90, 0)
                    .composite(blot, 120, 0)
                    .composite(blot, 150, 0)
                    .composite(blot, 180, 0)
                    .write(croppedImageDir + '-crop-scores.png');
                const b64croppedScores = await croppedScores.getBufferAsync(jimp.MIME_PNG);

                const resultData = {
                    scores: await rekog.detectText(
                        {
                            Image: {
                                Bytes: b64croppedScores,
                            }
                        }).promise(),
                    names: await rekog.detectText(
                        {
                            Image: {
                                Bytes: b64croppedNames,
                            }
                        }).promise()
                };
                const finalMap = {};
                let i = 0;
                resultData.names.TextDetections.forEach(detection => {
                    console.log(detection.DetectedText);
                    if (detection.Type === 'LINE'){
                        const cleanedName = detection.DetectedText
                            .split(`'`).join('')
                            .split(`"`).join('')
                            .split(`'`).join('')
                            .split(`,`).join('')
                            .split(`.`).join('')
                            .split(`|`).join('')
                        ;
                        finalMap[cleanedName] = Number.parseInt(resultData.scores.TextDetections[i].DetectedText);
                        i++;
                    }
                });

                callback(null, {
                    statusCode: 200,
                    body: JSON.stringify(finalMap),
                });
            });
        }).end();
};
