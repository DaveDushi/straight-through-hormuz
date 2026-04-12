export class Pool {
    constructor(factory, initialSize = 10) {
        this.factory = factory;
        this.items = [];
        this.activeCount = 0;
        for (let i = 0; i < initialSize; i++) {
            const item = this.factory();
            item.active = false;
            this.items.push(item);
        }
    }

    acquire() {
        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i].active) {
                this.items[i].active = true;
                this.activeCount++;
                return this.items[i];
            }
        }
        const item = this.factory();
        item.active = true;
        this.items.push(item);
        this.activeCount++;
        return item;
    }

    release(item) {
        if (item.active) {
            item.active = false;
            this.activeCount--;
            if (item.mesh && item.mesh.parent) {
                item.mesh.parent.remove(item.mesh);
            }
        }
    }

    forEach(fn) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].active) {
                fn(this.items[i]);
            }
        }
    }

    releaseAll() {
        for (let i = 0; i < this.items.length; i++) {
            this.release(this.items[i]);
        }
    }
}
