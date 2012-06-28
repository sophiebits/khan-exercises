$.extend(KhanUtil, {
    makeObject: function(verts) {
        var object = {
            verts: verts,
            perspective: {
                pos: [0, 0, 0],
                angle: [0, 0, 0],
                offset: [0, 0, 5.0]
            },
            faces: []
        };

        var vectorLength = function(v) {
            return Math.sqrt(v[0] * v[0] +
                             v[1] * v[1] +
                             v[2] * v[2]);
        };

        var graph = KhanUtil.currentGraph;

        object.offsetPos = function(offset) {
            this.perspective.pos[0] += offset[0];
            this.perspective.pos[1] += offset[1];
            this.perspective.pos[2] += offset[2];
        };

        object.setPos = function(pos) {
            this.perspective.pos = pos.slice();
        };

        object.offsetAngle = function(offset) {
            this.perspective.angle[0] += offset[0];
            this.perspective.angle[1] += offset[1];
            this.perspective.angle[2] += offset[2];
        };

        object.setAngle = function(angle) {
            this.perspective.angle = angle.slice();
        };

        object.doPerspective = function(pt) {
            var p = [];

            var ang = this.perspective.angle;
            var pos = this.perspective.pos;

            p[0] = Math.cos(ang[1]) * (Math.sin(ang[2]) * (pt[1] - pos[1])
                 + Math.cos(ang[2]) * (pt[0] - pos[0]))
                 - Math.sin(ang[1]) * (pt[2] - pos[2]);

            p[1] = Math.sin(ang[0]) * (Math.cos(ang[1]) * (pt[2] - pos[2])
                 + Math.sin(ang[1]) * (Math.sin(ang[2]) * (pt[1] - pos[1])
                 + Math.cos(ang[2]) * (pt[0] - pos[0])))
                 + Math.cos(ang[0]) * (Math.cos(ang[2]) * (pt[1] - pos[1])
                 - Math.sin(ang[2]) * (pt[0] - pos[0]));

            p[2] = Math.cos(ang[0]) * (Math.cos(ang[1]) * (pt[2] - pos[2])
                 + Math.sin(ang[1]) * (Math.sin(ang[2]) * (pt[1] - pos[1])
                 + Math.cos(ang[2]) * (pt[0] - pos[0])))
                 - Math.sin(ang[0]) * (Math.cos(ang[2]) * (pt[1] - pos[1])
                 - Math.sin(ang[2]) * (pt[0] - pos[0]));

            return p;
        };

        object.doProjection = function(pt) {
            var p = this.doPerspective(pt);

            var offset = this.perspective.offset;

            var x1 = (p[0] - offset[0]) * (offset[2] / p[2]);
            var y1 = (p[1] - offset[1]) * (offset[2] / p[2]);

            return [x1, y1];
        };

        object.addFace = function(options) {
            var face = $.extend(true, {
                verts: [],
                color: "black"
            }, options);

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

            face.mappedVerts = function() {
                return _.map(this.verts, function(v) {
                    return object.doProjection(object.verts[v]);
                });
            };

            face.path = function() {
                return graph.path(
                    face.mappedVerts(),
                    { fill: face.color, stroke: false }
                );
            };

            this.faces.push(face);

            return this;
        };

        object.draw = function() {
            var sortedFaces = _.sortBy(this.faces, function(face) {
                return face.normal()[2];
            });

            var drawFaces = _.filter(sortedFaces, function(face) {
                return face.normal()[2] > 0;
            });

            var image = graph.raphael.set();
            _.each(drawFaces, function(face) {
                image.push(face.path());
            });
            return image;
        };

        object.images = [graph.raphael.set()];
        object.drawPending = false;

        object.doDraw = function() {
            if (!this.drawPending) {
                this.drawPending = true;

                this.images.push(this.draw());

                _.defer(function() {
                    object.images.shift().remove();
                    object.drawPending = false;
                });
            }
        };

        return object;
    }
});
