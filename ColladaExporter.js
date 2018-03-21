/*-----------------------------------------------------------------------------
Copyright 2018 Benjamin Collins

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

------------------------------------------------------------------------------*/
/**
 * @author kion / http://dashgl.com
 */
 
THREE.ColladaExporter = function() {}

THREE.ColladaExporter.prototype = {

    "constructor": THREE.ColladaExporter,

    "parse": function(input) {

        if (!input.isSkinnedMesh) {
            throw new Error("Collada Export Expects Skinned Mesh");
        }


        this.dae = "";

        var geometry = input.geometry;
        console.log(geometry);
        this.name = mesh.name || "mesh";
        this.skeleton = mesh.skeleton;

        this.bones = [];
        this.vertices = [];
        this.normals = [];
        this.uv = [];
        this.faces = [];
        this.skinIndices = [];
        this.skinWeights = [];
        this.material = input.material;
        this.fromGeometry(geometry);

        this.writeHeader();
        this.writeMaterial();
        this.writeGeometry();
        this.writeController();
        this.writeFooter();

        return this.dae;

    },

    "fromGeometry": function(geometry) {

        for (var i = 0; i < geometry.vertices.length; i++) {
            var x = geometry.vertices[i].x.toFixed(2);
            var y = geometry.vertices[i].y.toFixed(2);
            var z = geometry.vertices[i].z.toFixed(2);
            this.vertices.push(x + " " + y + " " + z + " ");

            this.skinIndices.push(geometry.skinIndices[i]);
            this.skinWeights.push(geometry.skinWeights[i]);
        }

        for (var i = 0; i < geometry.faces.length; i++) {

            var face = geometry.faces[i];
            var normal = geometry.faces[i].normal;
            var uv = geometry.faceVertexUvs[0][i];

            var nrml = normal.x + " " + normal.y + " " + normal.z + " ";
            var nIndex = this.normals.indexOf(nrml);
            if (nIndex === -1) {
                nIndex = this.normals.length;
                this.normals.push(nrml);
            }

            var indice = {
                "a": face.a + " " + nIndex + " ",
                "b": face.b + " " + nIndex + " ",
                "c": face.c + " " + nIndex + " "
            };

            var attr = Object.keys(indice);

            for (var k = 0; k < uv.length; k++) {
                var st = uv[k].x + " " + (1 - uv[k].y) + " ";
                var index = this.uv.indexOf(st);
                if (index === -1) {
                    index = this.uv.length;
                    this.uv.push(st);
                }
                indice[attr[k]] += index + " ";
            }

            this.faces.push(indice);

        }

    },

    "writeImage": function() {

        this.dae += '<data>';
        var data = this.material.map.image.toDataURL();
        var comma = data.indexOf(",") + 1;
        var base64 = data.substr(comma);

        var raw = atob(base64);
        for (i = 0; i < raw.length; i++) {
            var _hex = raw.charCodeAt(i).toString(16)
            this.dae += (_hex.length == 2 ? _hex : '0' + _hex);
        }

        this.dae += '</data>'

    },

    "writeHeader": function(name) {

        var date = new Date();

        this.dae += '<?xml version="1.0" encoding="utf-8" ?>';
        this.dae += '<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">';
        this.dae += '<asset>';
        this.dae += '<contributor>';
        this.dae += '<authoring_tool>Threejs Collada Exporter</authoring_tool>';
        this.dae += '<comments>0.0.1</comments>';
        this.dae += '<source_data>' + this.name + '</source_data>';
        this.dae += '</contributor>';
        this.dae += '<created>' + date.toUTCString() + '</created>';
        this.dae += '<up_axis>Y_UP</up_axis>';
        this.dae += '</asset>';

    },

    "writeMaterial": function() {

        this.dae += '<library_images>';
        this.dae += '<image id="image" depth="1">';
        this.dae += '<init_from>';
        this.dae += this.name + ".png";
        this.dae += '</init_from>'
        this.dae += '</image>';
        this.dae += '</library_images>';

        this.dae += '<library_materials>';
        this.dae += '<material id="material">';
        this.dae += '<instance_effect url="#effect"/>';
        this.dae += '</material>';
        this.dae += '</library_materials>';

        this.dae += '<library_effects>';
        this.dae += '<effect id="effect">';
        this.dae += '<profile_COMMON>';

        this.dae += '<newparam sid="image_surface">';
        this.dae += '<surface type="2D">';
        this.dae += '<init_from>image</init_from>';
        this.dae += '<format>A8R8G8B8</format>';
        this.dae += '</surface>';
        this.dae += '</newparam>';
        this.dae += '<newparam sid="image_sampler">';
        this.dae += '<sampler2D>';
        this.dae += '<source>image_surface</source>';
        this.dae += '<minfilter>LINEAR_MIPMAP_LINEAR</minfilter>';
        this.dae += '<magfilter>LINEAR</magfilter>';
        this.dae += '</sampler2D>';
        this.dae += '</newparam>';

        this.dae += '<technique sid="common">';
        this.dae += '<phong>';
        this.dae += '<diffuse>';
        this.dae += '<texture texture="image_sampler" texcoord="TEX0"/>';
        this.dae += '</diffuse>';
        this.dae += '</phong>';
        this.dae += '</technique>';
        this.dae += '</profile_COMMON>';
        this.dae += '</effect>';
        this.dae += '</library_effects>';

    },

    "writeGeometry": function() {

        var vlen = this.vertices.length;
        var nlen = this.normals.length;
        var ulen = this.uv.length;
        var flen = this.faces.length;

        this.dae += '<library_geometries>';
        this.dae += '<geometry id="geometry">';
        this.dae += '<mesh>';

        // Position Source

        this.dae += '<source id="position">';
        this.dae += '<float_array id="pos_array" count="' + vlen * 3 + '">';
        for (var i = 0; i < this.vertices.length; i++) {
            this.dae += this.vertices[i];
        }
        this.dae += '</float_array>';
        this.dae += '<technique_common>';
        this.dae += '<accessor count="' + vlen + '" source="#pos_array" stride="3">';
        this.dae += '<param name="X" type="float" />';
        this.dae += '<param name="Y" type="float" />';
        this.dae += '<param name="Z" type="float" />';
        this.dae += '</accessor>';
        this.dae += '</technique_common>';
        this.dae += '</source>';

        // Normal Source

        this.dae += '<source id="normals">';
        this.dae += '<float_array id="norm_array" count="' + nlen * 3 + '">';
        for (var i = 0; i < this.normals.length; i++) {
            this.dae += this.normals[i];
        }
        this.dae += '</float_array>';
        this.dae += '<technique_common>';
        this.dae += '<accessor count="' + nlen + '" source="#norm_array" stride="3">';
        this.dae += '<param name="X" type="float" />';
        this.dae += '<param name="Y" type="float" />';
        this.dae += '<param name="Z" type="float" />';
        this.dae += '</accessor>';
        this.dae += '</technique_common>';
        this.dae += '</source>';

        // Texture Source

        this.dae += '<source id="uv">';
        this.dae += '<float_array id="uv_array" count="' + ulen * 2 + '">';
        for (var i = 0; i < this.uv.length; i++) {
            this.dae += this.uv[i];
        }
        this.dae += '</float_array>';
        this.dae += '<technique_common>';
        this.dae += '<accessor count="' + ulen + '" source="#uv_array" stride="2">';
        this.dae += '<param name="S" type="float" />';
        this.dae += '<param name="T" type="float" />';
        this.dae += '</accessor>';
        this.dae += '</technique_common>';
        this.dae += '</source>';

        this.dae += '<vertices id="vertices">';
        this.dae += '<input semantic="POSITION" source="#position" />';
        this.dae += '</vertices>';

        this.dae += '<triangles count="' + flen + '" material="material">';
        this.dae += '<input semantic="VERTEX" source="#vertices" offset="0"/>';
        this.dae += '<input semantic="NORMAL" source="#normals" offset="1" />';
        this.dae += '<input semantic="TEXCOORD" source="#uv" offset="2" set="0" />';

        this.dae += '<p>';
        for (var i = 0; i < this.faces.length; i++) {
            this.dae += this.faces[i].a;
            this.dae += this.faces[i].b;
            this.dae += this.faces[i].c;
        }
        this.dae += '</p>';

        this.dae += '</triangles>';
        this.dae += '</mesh>';
        this.dae += '</geometry>';
        this.dae += '</library_geometries>';

    },


    "writeController": function() {

        this.dae += '<library_controllers>';
        this.dae += '<controller id="skin">';
        this.dae += '<skin source="#geometry">';
        this.dae += '<bind_shape_matrix>1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1</bind_shape_matrix>';

        var count = this.skeleton.bones.length;
        // Write Joints

        this.dae += '<source id="skin-joints">';
        this.dae += '<Name_array id="skin-joints-array" count="' + count + '">';
        this.skeleton.bones.forEach(bone => {
            var num = bone.name.toString();
            while (num.length < 3) {
                num = "0" + num;
            }
            var name = "Bone" + num;
            this.dae += name + " ";
        });
        this.dae += '</Name_array>';
        this.dae += '<technique_common>';
        this.dae += '<accessor source="#skin-joints-array" count="' + count + '" stride="1">';
        this.dae += '<param name="JOINT" type="name"/>';
        this.dae += '</accessor>';
        this.dae += '</technique_common>';
        this.dae += '</source>';

        this.dae += '<source id="skin-pose">';
        this.dae += '<float_array id="skin-pose-array" count="' + (count * 16) + '">';
        this.skeleton.boneInverses.forEach(inverse => {
            var matrix = inverse.clone();
            matrix.transpose();
            matrix.elements.forEach(float => {
                this.dae += float + " ";
            });
        });
        this.dae += '</float_array>';
        this.dae += '<technique_common>';
        this.dae += '<accessor source="#skin-pose-array" count="' + count + '" stride="16">';
        this.dae += '<param name="TRANSFORM" type="float4x4"/>';
        this.dae += '</accessor>';
        this.dae += '</technique_common>';
        this.dae += '</source>';

        var vcount = [];
        var v = [];
        var weights = [];

        var keys = ["x", "y", "z", "w"];

        for (var i = 0; i < this.vertices.length; i++) {

            var count = 0;

            keys.forEach(idx => {
                if (this.skinWeights[i][idx] === 0) {
                    return;
                }

                count++;
                var weightIndex = weights.indexOf(this.skinWeights[i][idx]);
                if (weightIndex === -1) {
                    weightIndex = weights.length;
                    weights.push(this.skinWeights[i][idx]);
                }

                v.push(this.skinIndices[i][idx]);
                v.push(weightIndex);
            });

            vcount.push(count);

        }

        this.dae += '<source id="skin-weights">';
        this.dae += '<float_array id="skin-weights-array" count="' + weights.length + '">';
        weights.forEach(float => {
            this.dae += float + " ";
        });
        this.dae += '</float_array>';
        this.dae += '<technique_common>';
        this.dae += '<accessor source="#skin-weights-array" count="' + weights.length + '" stride="1">';
        this.dae += '<param name="WEIGHT" type="float"/>';
        this.dae += '</accessor>';
        this.dae += '</technique_common>';
        this.dae += '</source>';
        this.dae += '<joints>';
        this.dae += '<input semantic="JOINT" source="#skin-joints"/>';
        this.dae += '<input semantic="INV_BIND_MATRIX" source="#skin-pose"/>';
        this.dae += '</joints>';
        this.dae += '<vertex_weights count="' + this.vertices.length + '">';
        this.dae += '<input semantic="JOINT" source="#skin-joints" offset="0"/>';
        this.dae += '<input semantic="WEIGHT" source="#skin-weights" offset="1"/>';
        this.dae += '<vcount>';
        vcount.forEach(dword => {
            this.dae += dword + " ";
        });
        this.dae += '</vcount>';
        this.dae += '<v>';
        v.forEach(dword => {
            this.dae += dword + " ";
        });
        this.dae += '</v>';
        this.dae += '</vertex_weights>';

        this.dae += '</skin>';
        this.dae += '</controller>';
        this.dae += '</library_controllers>';

    },

    "writeFooter": function() {

        this.dae += '<library_visual_scenes>';
        this.dae += '<visual_scene id="DefaultScene">';

        this.dae += '<node name="Armature" type="NODE">';
        this.writeBones(this.skeleton.bones[0]);
        this.dae += '</node>';

        this.dae += '<node name="Mesh" type="NODE">';
        this.dae += '<instance_controller url="#skin">';
        this.dae += '<skeleton>#Bone000</skeleton>';
        this.dae += '<bind_material>';
        this.dae += '<technique_common>';
        this.dae += '<instance_material symbol="material" target="#material">';
        this.dae += '<bind_vertex_input semantic="TEX0" input_semantic="TEXCOORD" input_set="0"/>';
        this.dae += '</instance_material>';
        this.dae += '</technique_common>';
        this.dae += '</bind_material>';
        this.dae += '</instance_controller>';
        this.dae += '</node>';

        this.dae += '</visual_scene>';
        this.dae += '</library_visual_scenes>';
        this.dae += '<scene>';
        this.dae += '<instance_visual_scene url="#DefaultScene" />';
        this.dae += '</scene>';
        this.dae += '</COLLADA>';

    },

    "writeBones": function(bone) {

        var num = bone.name.toString();
        while (num.length < 3) {
            num = "0" + num;
        }
        var name = "Bone" + num;

        var matrix = bone.matrix.clone();
        matrix.transpose();

        this.dae += '<node id="' + name + '" name="' + name + '" sid="' + name + '" type="JOINT">';
        this.dae += '<matrix sid="transform">';
        matrix.elements.forEach(float => {
            this.dae += float + " ";
        });
        this.dae += '</matrix>';

        bone.children.forEach(child => {
            this.writeBones(child);
        });

        this.dae += '</node>';
    }

}
