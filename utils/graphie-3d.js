$.extend(KhanUtil, {
    makeObject: function(verts) {
        var object = {
            verts: verts,
            faces: []
        };

        object.addFace = function(face) {
            this.faces.push($.extend(true, {
                verts: [],
                color: "black"
            }, face));

            return this;
        };

        return object;
    }
});
