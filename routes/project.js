 const express = require('express');
 const router = express.Router();
 const multer = require('multer');
 const build = require('../build');
 const fs = require('fs-extra');
 const path = require('path');
 const constants = require('../constants');


 const storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, constants.UPLOAD_DIRECTORY);
   },
   //  limits: {
   //     fileSize: 1024 * 1024 * 5
   //   },
   filename: function (req, file, cb) {
     cb(null, file.originalname);
   }
 });

 const fileFilter = (req, file, cb) => {
   // reject a file
   if (file.mimetype === 'application/zip') {
     cb(null, true);
   } else {
     cb(null, false);
   }
 };

 const upload = multer({
   storage: storage,
   fileFilter: fileFilter
 });

 const readerHandling = (path, res) => {
   return new Promise((resolve, reject) => {
      const reader = fs.createReadStream(path);
      
      reader.on('end', function () {
        resolve();
      });
      
      reader.on('error', function (err) {
        reject(err);
      });

      reader.pipe(res)
    }

  )
 }

 const deleteFiles = (path) => {

   return new Promise((resolve, reject) => {
    fs.remove(path, (err) => {
      if(err){
        reject(err);
      }
    })

    resolve();
   })
 }

 router.post('/', upload.single('projectPackage'), async (req, res, next) => {
   
  const fileName = req.file.filename.replace(".zip","");
  const filePath = req.file.path;
  const unzipPath = path.join(constants.UNZIP_PATH, fileName);
   
   try {
     
    const outputPath = await build(fileName);
        
    res.set('Content-type', 'application/octet-stream');
    
    await readerHandling(outputPath, res)
    
    res.status(201).end()

    
  } catch (error) {
    
    console.error('Package generation failure: ' + error);
    res.status(500).send('APK package generation failed. ' + error).end();
    
  }
  
  try {
    deleteFiles(filePath);
    // deleteFiles(unzipPath);

  } catch (error) {
    console.error(error);
  }

 });

 module.exports = router;
