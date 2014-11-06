import getItemModelName from 'appkit/utils/model';

export default Ember.ArrayController.extend({
  // sortProperties : ['itemData.publish_date'],
  // sortAscending  : false,
  sortedByPublish: true,

  orderBy: null,
  orderAscending: false,

  contentType: null,
  lockedItems: Ember.A([]),

  recordLimit: 0,
  originalRecordLimit: 0,
  limited: function () {
    return this.get('content.length') >= this.get('recordLimit');
  }.property('content.@each', 'recordLimit'),

  filterQuery: '',

  columnChoices: function () {
    return this.get('contentType.controls').rejectBy('name', 'name').rejectBy('name', 'preview_url').rejectBy('name', 'instruction');
  }.property('contentType.controls.@each'),

  cmsControls: function () {
    return this.get('contentType.controls').filterBy('showInCms');
  }.property('contentType.controls.@each.showInCms'),

  _updateItemControls: function (item) {
    var cmsControls = Ember.A([]);
    this.get('cmsControls').forEach(function (control) {
      cmsControls.pushObject({
        value: item.get('itemData')[control.get('name')],
        controlType: control.get('controlType'),
        control: control
      });
    });
    item.set('cmsControls', cmsControls);
    return item;
  },

  sortedByChanged: function () {
    this.setProperties({
      sortedByPublish: false,
      sortedByCreated: false,
      sortedByAlpha: false
    });

    switch (this.get('sortProperties.firstObject')) {
    case 'itemData.publish_date':
      this.set('sortedByPublish', true);
      break;
    case 'itemData.create_date':
      this.set('sortedByCreated', true);
      break;
    case 'itemData.name':
      this.set('sortedByAlpha', true);
      break;
    }

  }.observes('sortProperties'),

  cmsItems: Ember.arrayComputed('model.@each.itemData', 'cmsControls.@each.showInCms', {
    addedItem: function (array, item, changeMeta) {

      if (item.constructor.typeKey === 'control') {
        array.forEach(this._updateItemControls.bind(this));
      } else {
        array.pushObject(this._updateItemControls(item));
      }

      return array;
    },
    removedItem: function (array, item) {
      if (item.constructor.typeKey !== 'control') {
        array.removeObject(item);
      }
      return array;
    }
  }),

  sortedCmsItems: function () {

    var filterQuery = this.get('filterQuery');

    var sortedCmsItems = this.get('cmsItems').sortBy.apply(this, this.get('sortProperties'));

    if (!this.get('sortAscending')) {
      sortedCmsItems.reverse();
    }

    sortedCmsItems = sortedCmsItems.filter(function (item) {
      if (!filterQuery) {
        return true;
      } else {
        return (new RegExp(filterQuery, 'ig')).test(item.get('itemData.name'));
      }
    });

    return sortedCmsItems;
  }.property('cmsItems.@each', 'sortProperties', 'sortAscending', 'filterQuery'),

  locksChanged: function () {
    this.get('cmsItems').setEach('lockedBy', null);
    this.get('lockedItems').forEach(function (lock) {
      this.get('cmsItems').findBy('id', lock.get('id')).set('lockedBy', lock.get('email'));
    }, this);
  }.observes('lockedItems.@each'),

  actions: {

    toggleShowInCms: function (control) {
      control.toggleProperty('showInCms');
      this.get('contentType').save();
    },

    sortToggle: function (control) {

      this.get('cmsControls').setEach('isSortAscending', false);
      this.get('cmsControls').setEach('isSortDescending', false);

      // var field = 'itemData.' + control.get('name');

      // var sortProperties = this.get('sortProperties');

      // if (sortProperties.get('firstObject') === field) {
      //   this.toggleProperty('sortAscending');
      // } else {
      //   this.set('sortAscending', true);
      // }

      var orderBy = control.get('name');

      if (control.get('controlType.widget') === 'datetime') {
        orderBy = '_sort_' + control.get('name');
      }

      if (this.get('orderBy') === orderBy) {
        this.toggleProperty('orderAscending');
      } else {
        this.set('orderAscending', true);
      }

      this.set('orderBy', orderBy);

      control.set('isSortAscending', this.get('orderAscending'));
      control.set('isSortDescending', !this.get('orderAscending'));

      this.set('model', this.store.find(this.get('itemModelName'), {
        limit: this.get('recordLimit'),
        orderBy: orderBy,
        desc: !this.get('orderAscending')
      }));

      // sortProperties.insertAt(0, field);
      // sortProperties = sortProperties.uniq();

      // Ember.Logger.info('Sorting by', sortProperties);
      //
      // this.set('sortProperties', sortProperties);

    },

    gotoEdit: function (contentTypeId, itemId) {
      this.transitionToRoute('wh.content.type.edit', contentTypeId, itemId);
    },

    moreRecords: function () {
      this.set('isLoading', true);
      this.set('recordLimit', this.get('recordLimit') + this.get('originalRecordLimit'));

      this.set('content', Ember.A([]));

      var controller = this;
      this.store.find(this.get('itemModelName'), { limit: this.get('recordLimit') }).then(function (records) {
        controller.set('isLoading', false);
        controller.set('content', records);
      });
    }
  }

});
