$.extend(KhanUtil, {
    // make a 3d object, which holds the vertices,
    //   faces, and perspective of an object
    makeObject: function(verts) {
        var object = {
            verts: verts,
            perspective: KhanUtil.makeMatrix([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]),
            scale: 5.0,
            faces: []
        };

        // find the length of a 3d vector
        var vectorLength = function(v) {
            return Math.sqrt(v[0] * v[0] +
                             v[1] * v[1] +
                             v[2] * v[2]);
        };

        var graph = KhanUtil.currentGraph;

        // set and offset the camera pos
        object.offsetPos = function(offset) {
            this.perspective[0][3] += offset[0];
            this.perspective[1][3] += offset[1];
            this.perspective[2][3] += offset[2];
        };

        object.setPos = function(pos) {
            this.perspective[0][3] = pos[0];
            this.perspective[1][3] = pos[1];
            this.perspective[2][3] = pos[2];
        };

        // perform a rotation of ang around the vector (x, y, z)
        object.rotate = function(x, y, z, ang) {
            var s = Math.sin(ang);
            var c = Math.cos(ang);

            var rotation = KhanUtil.makeMatrix([
                [x*x*(1-c)+c,   x*y*(1-c)-z*s, x*z*(1-c)+y*s, 0],
                [y*x*(1-c)+z*s, y*y*(1-c)+c,   y*z*(1-c)-x*s, 0],
                [x*z*(1-c)-y*s, y*z*(1-c)+x*s, z*z*(1-c)+c,   0],
                [0,             0,             0,             1]
            ]);

            this.perspective = KhanUtil.matrixMult(this.perspective, rotation);
        };

        // perform the perspective transformation stored in
        //   object.perspective on a 3d point
        object.doPerspective = function(pt) {
            var newpt = KhanUtil.arrayToColumn(pt);

            newpt[3] = [-1];

            var result = KhanUtil.matrixMult(this.perspective, newpt);

            return KhanUtil.columnToArray(result).slice(0, 3);
        };

        // perform the perspective transformation and then project
        //   the 3d point onto a 2d screen
        object.doProjection = function(pt) {
            var p = this.doPerspective(pt);

            var x1 = p[0] * (this.scale / p[2]);
            var y1 = p[1] * (this.scale / p[2]);

            return [x1, y1];
        };

        // add a face to the object, with verts being indices of the
        //   object.verts array
        object.addFace = function(options) {
            var face = $.extend(true, {
                verts: [],
                color: "black"
            }, options);

            // compute the normal of a face
            face.normal = function() {
                var a = object.doPerspective(object.verts[this.verts[0]]);
                var b = object.doPerspective(object.verts[this.verts[1]]);
                var c = object.doPerspective(object.verts[this.verts[2]]);

                var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
                var ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];

                var normal = [
                    ab[1] * ac[2] - ab[2] * ac[1],
                    ab[2] * ac[0] - ab[0] * ac[2],
                    ab[0] * ac[1] - ab[1] * ac[0]
                ];

                var length = vectorLength(normal);

                return _.map(normal, function(e) { return e / length; });
            };

            // find the array of the projected points of the face
            face.mappedVerts = function() {
                return _.map(this.verts, function(v) {
                    return object.doProjection(object.verts[v]);
                });
            };

            // create a path of the face
            face.path = function() {
                return graph.path(
                    face.mappedVerts(),
                    { fill: face.color, stroke: false }
                );
            };

            this.faces.push(face);

            return this;
        };

        // draw the object, performing backface culling to ensure
        //   faces don't intersect each other
        object.draw = function() {
            // sort the faces by how much the faces point backwards
            var sortedFaces = _.sortBy(this.faces, function(face) {
                return face.normal()[2];
            });

            // filter out the faces that don't face forwards
            var drawFaces = _.filter(sortedFaces, function(face) {
                return face.normal()[2] > 0;
            });

            // draw each of the faces, and store it in a raphael set
            var image = graph.raphael.set();
            _.each(drawFaces, function(face) {
                image.push(face.path());
            });
            return image;
        };

        // a list of the current and next frame
        // each time a new one is created, the old one is
        // removed later to avoid fast flickering
        object.images = [graph.raphael.set()];

        // whether or not an image is pending for deletion,
        // in which case we shouldn't draw again
        object.drawPending = false;

        // do the full double-buffered drawing
        object.doDraw = function() {
            // only draw if we don't have a second frame waiting
            if (!this.drawPending) {
                this.drawPending = true;

                // do the drawing, and store the new frame
                this.images.push(this.draw());

                // defer removing the old frame
                _.defer(function() {
                    object.images.shift().remove();
                    object.drawPending = false;
                });
            }
        };

        return object;
    }
});
