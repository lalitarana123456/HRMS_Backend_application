const multer = require('multer');//taking multer package
const path = require('path');
const fs = require('fs');


//defining upload directory
const uploadDir = path.join(__dirname, '../uploads');

//ensuring the uploads directory exists
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive: true});
}

//configuring multer for the file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) =>{
            cb(null, uploadDir);
        },
        filename: (req, file, cb)=>{
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
    }),

    fileFilter: (req, file, cb) =>{
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/jpg', //'images
            'application/pdf',                      //pdf
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' //docs

        ];
        if(allowedTypes.includes(file.mimetype)){
            cb(null, true);
        }else{
            cb(new Error('Only JPEG, PNG, JPG, PDF, DOC, and DOCX files are allowed'), false);
        }
    },
    limits: {fileSize: 5 * 1024 * 1024}, //limiting file size to 5MB
});

module.exports = upload;
