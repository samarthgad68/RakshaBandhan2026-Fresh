const path = require('path');
const fs = require('fs');

// युजरने निवडलेली भाषा आणि Weight (regular किंवा bold) नुसार फॉन्ट पाथ देणारे फंक्शन
function getFontPath(languageCode, isBold = false) {
    const weight = isBold ? 'Bold' : 'Regular';
    let fontFolder = 'Latin'; // डीफॉल्ट इंग्रजी

    switch (languageCode.toLowerCase()) {
        case 'mr': // मराठी
        case 'hi': // हिंदी
        case 'sa': // संस्कृत
        case 'ne': // नेपाली
        case 'devanagari':
            fontFolder = 'Devanagari';
            break;
        
        case 'bn': // बंगाली
        case 'as': // असमी
        case 'bengali':
            fontFolder = 'Bengali';
            break;

        case 'ta': // तमिळ
        case 'tamil':
            fontFolder = 'Tamil';
            break;

        case 'te': // तेलगु
        case 'telugu':
            fontFolder = 'Telugu';
            break;

        case 'kn': // कन्नड
        case 'kannada':
            fontFolder = 'Kannada';
            break;

        case 'ml': // मल्याळम
        case 'malayalam':
            fontFolder = 'Malayalam';
            break;

        case 'gu': // गुजराती
        case 'gujarati':
            fontFolder = 'Gujarati';
            break;

        case 'pa': // पंजाबी (Gurmukhi)
        case 'punjabi':
        case 'gurmukhi':
            fontFolder = 'Gurmukhi';
            break;

        case 'or': // ओडिया
        case 'odia':
        case 'oriya':
            fontFolder = 'Odia';
            break;

        case 'ur': // उर्दू (महत्त्वाचे: Urdu साठी नेहमी Nastaliq फॉन्ट वापरणे)
        case 'urdu':
            return path.join(__dirname, 'public', 'fonts', 'Urdu', `NotoNastaliqUrdu-${weight}.ttf`);

        case 'ar': // अरेबिक
        case 'arabic':
            fontFolder = 'Arabic';
            break;

        case 'sat': // संथाली (Ol Chiki)
        case 'olchiki':
            fontFolder = 'OlChiki';
            break;

        case 'mni': // मणिपुरी (Meitei Mayek)
        case 'manipuri':
        case 'meeteimayek':
            fontFolder = 'MeeteiMayek';
            break;

        default:
            fontFolder = 'Latin'; // इंग्रजी किंवा इतर भाषांसाठी
            break;
    }

    // फॉन्ट फाईलचे अचूक नाव तयार करणे (उदा. NotoSansDevanagari-Regular.ttf)
    let fontName = `NotoSans${fontFolder}-${weight}.ttf`;
    
    // जर Latin असेल तर त्याचे नाव वेगळे असते (NotoSans-Regular.ttf)
    if (fontFolder === 'Latin') {
        fontName = `NotoSans-${weight}.ttf`;
    }

    return path.join(__dirname, 'public', 'fonts', fontFolder, fontName);
}

module.exports = { getFontPath };