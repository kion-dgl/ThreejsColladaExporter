# ThreejsColladaExporter
There are many resources for exporting to Threejs but not many resources for exporting files from Threejs to be exported to 3d file editors. This is a simple exporter for Threejs that takes a SkinnedMesh as an argument and exports a rigged .dae model that can be loaded into Blender.

### Issues

Still a very early version. Only supports SkinnedMesh, with a single material, and must use Geometry and now BufferGeometry.

### Sample

Example code using [File Saver](https://github.com/eligrey/FileSaver.js) to download a blob from the browser to the client pc.

```
  // Generate Mesh
  
	var mesh = new THREE.SkinnedMesh(geometry, material);
	var rootBone = armSkeleton.bones[0];
	mesh.add(rootBone);
	mesh.bind(armSkeleton);
  
  // Export
  
  var expt = new THREE.ColladaExporter();
	var output = expt.parse(mesh);
	var blob = new Blob([output], {
		type: "model/vnd.collada+xml"
	});
  saveAs(blob, mesh.name + '.dae');
```

### Example

Example implementation where a file format is parsed in the browser using Threejs and exported to .dae format. [Live Example](https://mml.dashgl.com/anims/). (Note that files from CDDATA/DAT* are required on the client side).

![Threejs Collada Exporter](https://i.imgur.com/0ipvYGY.png)
