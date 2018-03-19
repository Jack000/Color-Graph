# ColorGraph.js

A <em>color graph</em> is a color palette arranged in an undirected, weighted graph.
see more info on this concept here: http://brandmark.io/color-wheel/discussion/

colorgraph.js takes an &lt;img&gt; and extracts its color graph. The result is a color palette and an adjacency matrix

this library is meant for use on browsers, and requires the color quantization library [RgbQuant](https://github.com/leeoniya/RgbQuant.js/)
(can work on node.js as well, but will require the node-canvas library)

usage:

1: quantize an image
```
// img: html <img> element
// num: number of colors to quantize into
// use_mode: Boolean, smooth the image using the mode of a 3x3 bucket (removes spurious 1px adjacency noise caused by down-scale sharpening)

quantized = colorgraph.quantize(img,num,use_mode)

{
    palette: [...], // quantized RGB palette
    out: {...}, // quantized datastructure from RgbQuant
    canvas: {...}, // quantized canvas for display
    sizes: [...] // normalized area of each color in palette
}

```

2: get color adjacency matrix (this is the node connectivity matrix that defines the graph)
```
// palette: input RGB palette
// canvas: canvas containing the image
// normalize: Boolean, normalize the adjacency matrix with respect to image perimeter size (for comparing the adjacency matrix of different sized images)
adjacency = colorgraph.get_connectivity_matrix(quantized.palette, quantized.canvas, normalize)

// row-major adjacency matrix (ith row = ith palette color)
[
[...]
[...]
[...]
]
```