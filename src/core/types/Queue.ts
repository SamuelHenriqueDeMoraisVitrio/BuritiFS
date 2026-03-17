


export class Queue {
  private row: (() => Promise<void>)[] = []
  private running: boolean = false;

  private async execAction(){
    if(this.running) return;
    this.running = true;

    while (this.row.length > 0) {
      await this.row.shift()?.();
    }

    this.running = false;
  }

  addAction(action: () => Promise<void>){
    this.row.push(action);
    void this.execAction();
  }
}





