const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();

const transformationOptions = [
   { name: "w32", width: 32 },
   { name: "w140", width: 140 },
   { name: "w280", width: 280 },
   { name: "w640", width: 640 },
]

exports.handler = async (event) => {
   try {
      const Bucket = event.Records[0].s3.bucket.name;
      const Key = event.Records[0].s3.object.key;
      const s3obj = { Bucket, Key};
      console.log(`Image Resizing: ${Key}`);
      const image = await s3.getObject(s3obj).promise();
      await Promise.all(
         transformationOptions.map(async ({name, width}) => {
            try {
               console.log("try");
               const dupVerification = Key.split('_')[Key.split('_').length - 1][0];
               if (dupVerification === 'w') {
                  console.log('이미 처리된 파일');
                  return {
                     statusCode: 400,
                     body: event,
                  }
               }
               const newKey = `${Key}_${name}`
               const resizedImage = await sharp(image.Body)
                  .rotate()
                  .resize(width)
                  .toBuffer();
               await s3
               .putObject({ 
                  Bucket: Bucket,
                  Body: resizedImage,
                  Key: newKey,
               })
               .promise();
               console.log('put', resizedImage.length);
               throw newKey;
            } catch(err) {
               throw err
            }
         })
      );
      return {
         statusCode: 200,
         body: event,
      }
   } catch (err){
      console.log(err);
      return { 
         statusCode: 500,
         body: event,
      }
   }
 };
 