var PARTICLE_WIDTH = 12;
var PARTICLE_HEIGHT = 6;
var MIN_SCALE = 0.6;

var NUMBER_OF_PARTICLES = 80;
var MIN_INITIAL_SPEED = 300;
var MAX_INITIAL_SPEED = 700;
var EMISSION_ANGLE_RANGE = 0.6;
var SPIN_RANGE = 20;
var GRAVITY = 2000;

var COLORS = [
  "#f6ec09",
  "#ff4500",
  "#85da45",
  "#4ea6f1",
];

var PARTICLE_DIAMETER = Math.sqrt(PARTICLE_WIDTH * PARTICLE_WIDTH + PARTICLE_HEIGHT * PARTICLE_HEIGHT);

function random(low, high) {
  return Math.random() * (high - low) + low;
}

function getColor() {
  return COLORS[Math.floor(random(0, COLORS.length))];
}

function ConfettiBurst(el) {
    this.el = el;
    this.particles = [];

    this.startTime = null;
    this.timer = null;

    var burst = this;
    this.tick = function tick() {
        var now = Date.now();
        burst.redraw();
        // TODO(alpert): Kind of weird that `burst.redraw` mutates `particles`
        if (burst.particles.length) {
            requestAnimationFrame(tick);
        }
    };
}

ConfettiBurst.prototype.start = function() {
    var particles = this.particles;

    for (var i = 0; i < NUMBER_OF_PARTICLES; i++) {
        var speed = random(MIN_INITIAL_SPEED, MAX_INITIAL_SPEED);
        var angle = -Math.PI / 2 + EMISSION_ANGLE_RANGE * random(-0.5, 0.5);

        var el = document.createElement("div");
        el.className = "confetto";
        el.style.backgroundColor = getColor();
        el.style.height = PARTICLE_HEIGHT + "px";
        el.style.width = PARTICLE_WIDTH + "px";

        particles.push({
            birth: Date.now(),
            x: 0,
            y: 0,
            spin: SPIN_RANGE * random(-0.5, 0.5),
            angle: random(0, 2 * Math.PI),
            scale: random(MIN_SCALE, 1.0),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            el: el
        });
    }

    requestAnimationFrame(this.tick);
};

ConfettiBurst.prototype.redraw = function() {
    var now = Date.now();
    var particles = this.particles;

    for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        var age = (now - particle.birth) / 1000;

        var angle = particle.angle + particle.spin * age;
        var x = particle.x + particle.vx * age;
        var y = particle.y + particle.vy * age + GRAVITY * age * age / 2;

        var scale = particle.scale;
        var startDying = 0.5;
        var death = 1.0;
        if (age > startDying) {
            scale *= 1 - (age - startDying) / (death - startDying);
        }
        particle.el.style.transform =
            "translate(" + x + "px, " + y + "px) rotate(" + angle +
            "rad) scale(" + scale + ")";
        if (!particle.el.parentNode) {
            this.el.appendChild(particle.el);
        }

        if (age > death) {
            this.el.removeChild(particle.el);
            // swap!
            if (i === particles.length - 1) {
                particles.pop();
            } else {
                particles[i] = particles.pop();
                i--;
            }
            continue;
        }
    }
};

var Confetti = {
    /**
     * Make a burst of confetti! Confetti confetti.
     */
    render: function(el) {
        new ConfettiBurst(el).start();
    }
};

window.Confetti = Confetti;
