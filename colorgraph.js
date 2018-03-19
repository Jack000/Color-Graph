/*
*  colorgraph.js - Copyright 2018 Jack Qiao
*  (MIT License)
*/

var colorgraph = (function(document, RgbQuant, max_width, max_height) {
    function pixel_at(pixels, width, x, y){
        var index = 4*(y*width+x);
        return [pixels[index],pixels[index+1],pixels[index+2]];
    }

    function pequal(p1, p2){
        if(p1[0] == p2[0] && p1[1] == p2[1] && p1[2] == p2[2]){
            return true;
        }

        return false;
    }

    function pindex(palette, p){
        for(var i=0; i<palette.length; i++){
            if(palette[i][0] == p[0] && palette[i][1] == p[1] && palette[i][2] == p[2]){
                return i;
                break;
            }
        }
        return 0;
    }

    function get_connectivity_matrix(palette, canvas, normalize){
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;
        var pixelCount = pixels.length;

        var conn = [];
        for(var i=0; i<palette.length; i++){
            var p = [];
            for(var j=0; j<palette.length; j++){
                p.push(0);
            }
            conn.push(p);
        }
    
        for (var x=0; x<canvas.width-1; x++){
            for (var y=0; y<canvas.height-1; y++){
                var p1 = pixel_at(pixels, canvas.width, x, y);
                var p2 = pixel_at(pixels, canvas.width, x+1, y);
                var p3 = pixel_at(pixels, canvas.width, x+1, y+1);
                var p4 = pixel_at(pixels, canvas.width, x, y+1);

                if(!pequal(p1, p2)){
                    conn[pindex(palette,p1)][pindex(palette,p2)] += 1;
                    conn[pindex(palette,p2)][pindex(palette,p1)] += 1;
                }
                if(!pequal(p1, p3)){
                    conn[pindex(palette,p1)][pindex(palette,p3)] += 1;
                    conn[pindex(palette,p3)][pindex(palette,p1)] += 1;
                }
                if(!pequal(p1, p4)){
                    conn[pindex(palette,p1)][pindex(palette,p4)] += 1;
                    conn[pindex(palette,p4)][pindex(palette,p1)] += 1;
                }
                if(!pequal(p2, p3)){
                    conn[pindex(palette,p2)][pindex(palette,p3)] += 1;
                    conn[pindex(palette,p3)][pindex(palette,p2)] += 1;
                }
                if(!pequal(p2, p4)){
                    conn[pindex(palette,p2)][pindex(palette,p4)] += 1;
                    conn[pindex(palette,p4)][pindex(palette,p2)] += 1;
                }
                if(!pequal(p3, p4)){
                    conn[pindex(palette,p3)][pindex(palette,p4)] += 1;
                    conn[pindex(palette,p4)][pindex(palette,p3)] += 1;
                }
            }
        }
        
        // normalize adjacency to perimeter
        if(normalize){
            var scale = 1;
            if(canvas.width > max_width && max_width/canvas.width < scale){
                scale = max_width/canvas.width;
            }
            if(canvas.height > max_height && max_height/canvas.height < scale){
                scale = max_height/canvas.height;
            }

            var width = Math.floor(canvas.width*scale);
            var height = Math.floor(canvas.height*scale);
            var scalingfactor = 2*(width+height);

            for(var i=0; i<conn.length; i++){
                var row = conn[i];
                for(var j=0; j<row.length; j++){
                    row[j] /= scalingfactor;
                }
            }
        }
        
        return conn;
    }

    function quantize(img, numcolors, use_mode){
        var can = document.createElement('canvas');
        var scale = 1;
        if(img.naturalWidth > max_width && max_width/img.naturalWidth < scale){
            scale = max_width/img.naturalWidth;
        }
        if(img.naturalheight > max_height && max_height/img.naturalHeight < scale){
            scale = max_height/img.naturalHeight;
        }
    
        var width = Math.floor(img.naturalWidth*scale);
        var height = Math.floor(img.naturalHeight*scale);
                
        can.width = width;
        can.height = height;
    
        var ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        var opts = {
            colors: numcolors,
            method: 2,
            boxSize: [64,64],
            boxPxls: 2,
            initColors: 4096,
            minHueCols: 256,
            dithKern: null,
            dithDelta: 0,
            dithSerp: false,
            palette: [],
            reIndex: false,
            useCache: true,
            cacheFreq: 10,
            colorDist: "euclidean"
        };

        var q = new RgbQuant(opts);
        q.sample(can);
        var pal = q.palette(true, true);
        var out = q.reduce(can);

        var can_out = document.createElement('canvas');
        can_out.width = width;
        can_out.height = height;
        var ctx_out = can_out.getContext('2d');
        var out_data = ctx_out.getImageData(0,0,width,height);
        out_data.data.set(out);
        ctx_out.putImageData(out_data,0,0);
    
        // mode filter
        if(use_mode){
            filter_mode(can_out);
            out_data = ctx_out.getImageData(0,0,width,height);
        }
    
        var imageData = ctx.getImageData(0, 0, width, height);
        var pixels = imageData.data;
        var pixelCount = pixels.length;

        var pixels_out = out_data.data;

        var sizes = []; // percent of image
        for(var i=0; i<pal.length; i++){
            sizes.push(0);
        }
        for (var i = 0, offset, r, g, b, a; i < pixelCount; i = i + 4) {
            offset = i;
            a = pixels[offset + 3];
        
            if (a >= 125) {
                r = pixels[offset + 0];
                g = pixels[offset + 1];
                b = pixels[offset + 2];
    
                r_out = pixels_out[offset + 0];
                g_out = pixels_out[offset + 1];
                b_out = pixels_out[offset + 2];
    
                for(var j=0; j<pal.length; j++){
                    if(r_out == pal[j][0] && g_out == pal[j][1] && b_out == pal[j][2]){
                        sizes[j] += 1;
                    }
                }
            }
        }

        for(var i=0; i<sizes.length; i++){
            sizes[i] /= pixelCount;
        }
    
        return {palette: pal, out: out_data.data, canvas: can_out, sizes: sizes};
    }

    function filter_mode(canvas){
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        var pixels = imageData.data;
        var pixelCount = pixels.length;
        var x, y, m, n;
    
        var newData = ctx.createImageData(canvas.width, canvas.height);
        var newPixels = newData.data;
        var ksize = 2;

        for (x = 0; x < canvas.width; x++) {
            for (y = 0; y < canvas.height; y++) {
                var w = [];
                // -1, 0, 1
                for(m=-ksize; m<ksize; m++){
                    for(n=-ksize; n<ksize; n++){
                        if(x+m < 0 || x+m >= canvas.width){
                            continue;
                        }
                        if(y+n < 0 || y+n >= canvas.height){
                            continue;
                        }
                        w.push(pixel_at(pixels,canvas.width,x+m,y+n));
                    }
                }
            
                var mv = mode(w);
                var i = y*canvas.width + x;
                i *= 4;
            
                newPixels[i] = mv[0];
                newPixels[i+1] = mv[1];
                newPixels[i+2] = mv[2];
                newPixels[i+3] = 255;
            }
        }
        newData.data.set(newPixels);
        ctx.putImageData(newData,0,0);
    }

    // mode = most frequent color
    function mode(arr) {
        var numMapping = {};
        var greatestFreq = 0;
        var mode;
        arr.forEach(function(p) {
            var key = Math.round(p[0]+1000*p[1]+1000000*p[2]);
            numMapping[key] = (numMapping[key] || 0) + 1;

            if (greatestFreq < numMapping[key]) {
                greatestFreq = numMapping[key];
                mode = p;
            }
        });
        return mode;
    }

    function colorize(img, can_out, quant, newpalette){ 	
        var pal = quant.palette;
    
        var scale = 1;
        if(img.naturalWidth > max_width && max_width/img.naturalWidth < scale){
            scale = max_width/img.naturalWidth;
        }
        if(img.naturalheight > max_height && max_height/img.naturalHeight < scale){
            scale = max_height/img.naturalHeight;
        }
                
        var width = Math.floor(img.naturalWidth*scale);
        var height = Math.floor(img.naturalHeight*scale);
    
        can_out.width = width;
        can_out.height = height;
    
        var ctx_out = can_out.getContext('2d');
        var out_data = ctx_out.getImageData(0,0,width,height);
        if(quant.out){
            out_data.data.set(quant.out);
        }
        else{
            ctx_out.drawImage(img, 0, 0, width, height);
            out_data = ctx_out.getImageData(0,0,width,height);
        }
        ctx_out.putImageData(out_data,0,0);
    
        var ctx = quant.canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, width, height);
        var pixels = imageData.data;
        var pixelCount = pixels.length;

        var pixels_out = out_data.data;

        for (var i = 0, offset, r, g, b, a; i < pixelCount; i = i + 4) {
            offset = i;
            var r_out = pixels_out[offset + 0];
            var g_out = pixels_out[offset + 1];
            var b_out = pixels_out[offset + 2];

            for(var j=0; j<pal.length; j++){
                if(r_out == pal[j][0] && g_out == pal[j][1] && b_out == pal[j][2]){
                    pixels_out[offset + 0] = newpalette[j][0];
                    pixels_out[offset + 1] = newpalette[j][1];
                    pixels_out[offset + 2] = newpalette[j][2];
                    break;
                }
            }
        }

        ctx_out.putImageData(out_data,0,0);
        return can_out;
    }

    // Reveal public methods
    return {
        quantize: quantize,
        get_connectivity_matrix: get_connectivity_matrix,
        colorize: colorize
    };
  
})(document, RgbQuant, 800, 600);