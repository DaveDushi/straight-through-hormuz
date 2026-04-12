export class Entity {
    constructor() {
        this.mesh = null;
        this.x = 0;
        this.z = 0;
        this.halfW = 1;
        this.halfH = 1;
        this.active = false;
        this.type = 'entity';
    }

    init(x, z) {
        this.x = x;
        this.z = z;
        this.active = true;
        if (this.mesh) {
            this.mesh.position.set(x, 0, z);
            this.mesh.visible = true;
        }
    }

    update(delta, context) {}

    syncMesh() {
        if (this.mesh) {
            this.mesh.position.x = this.x;
            this.mesh.position.z = this.z;
        }
    }

    onCollision(other) {}
}
