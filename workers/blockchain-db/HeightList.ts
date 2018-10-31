export class HeightList {
  data = new Uint32Array(0);
  rm_set = new Set<number>();
  sorted = true;
  pushOne(height: number) {
    const old_data = this.data;
    const new_date = new Uint32Array(old_data.length + 1);
    new_date.set(old_data, 0);
    new_date[old_data.length] = height;
    if (this.sorted) {
      this.sorted = !(old_data[old_data.length - 1] > height);//old_data[old_data.length - 1]可能是undefined，所以这里反向判断再取反
    }
    this.data = new_date;
  }
  pushList(height_list: number[]) {
    const old_data = this.data;
    const new_date = new Uint32Array(old_data.length + height_list.length);
    new_date.set(old_data, 0);
    for (var offset = old_data.length, i = 0, height; offset < new_date.length; offset += 1, i += 1) {
      height = height_list[i];
      new_date[offset] = height;
      if (this.sorted) {
        this.sorted = !(old_data[i - 1] > height);
      }
    }
    this.data = new_date;
  }
  removeOne(height: number) {
    this.rm_set.add(height)
  }
  getSortedList() {
    const { rm_set } = this;
    if (rm_set.size) {
      this.data = this.data.filter(h => !rm_set.has(h));
      rm_set.clear();
    }
    if (!this.sorted) {
      this.data.sort();
      this.sorted = true;
    }
    return this.data;
  }
  getMaxHeight() {
    const data = this.getSortedList();
    return data[data.length - 1] || 0;
  }

  destroiy(){
    delete this.data;
    this.rm_set.clear();
    delete this.rm_set;
  }
}
