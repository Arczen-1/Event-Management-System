const Jimp = require('jimp');

class SignatureValidationService {
  async validateSignature(imageBuffer, originalName) {
    const results = {
      isValid: false,
      errors: [],
      warnings: [],
      metadata: {}
    };

    try {
      // Basic file validation
      if (imageBuffer.length < 1000) {
        results.errors.push('File too small - likely not a valid signature');
      }
      if (imageBuffer.length > 5 * 1024 * 1024) {
        results.errors.push('File too large - maximum size is 5MB');
      }

      // Image content analysis
      const image = await Jimp.read(imageBuffer);
      results.metadata.width = image.bitmap.width;
      results.metadata.height = image.bitmap.height;
      results.metadata.aspectRatio = (image.bitmap.width / image.bitmap.height).toFixed(2);

      // Check dimensions
      if (image.bitmap.width < 100 || image.bitmap.height < 50) {
        results.errors.push('Image too small for a valid signature');
      }

      // Analyze color composition
      let darkPixelCount = 0;
      let totalPixels = image.bitmap.width * image.bitmap.height;
      
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const brightness = (red + green + blue) / 3;
        
        if (brightness < 128) {
          darkPixelCount++;
        }
      });

      const darkPixelPercentage = (darkPixelCount / totalPixels) * 100;
      results.metadata.inkCoverage = darkPixelPercentage.toFixed(1) + '%';

      // Signature validation rules
      if (darkPixelPercentage < 2) {
        results.errors.push('Image appears blank - no signature detected');
      } else if (darkPixelPercentage > 80) {
        results.errors.push('Image too dark - unlikely to be a signature');
      }

      if (darkPixelPercentage < 5) {
        results.warnings.push('Very light signature detected');
      }

      // Final validation
      results.isValid = results.errors.length === 0;

    } catch (error) {
      results.errors.push('Invalid image file');
    }

    return results;
  }
}

module.exports = new SignatureValidationService();