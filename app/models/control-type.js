var ControlType = DS.Model.extend({
  name     : DS.attr('string'),
  group    : DS.belongsTo('control-type-group'),
  faClass  : DS.attr('string'),
  widget   : DS.attr('string', { defaultValue: 'textfield' }),

  // The following are used as defaults for new controls of this type
  label      : DS.attr('string'),
  placeholder: DS.attr('string'),
  help       : DS.attr('string'),

  controlPartialPath: function () {
    return 'widgets/' + this.get('widget');
  }.property('widget'),
  infoPartialPath: function () {
    return 'widgets/info/' + this.get('widget');
  }.property('widget'),
});

ControlType.FIXTURES = [];

var controlTypeGroupId = 0,
    controlTypeId = 0;

$.each(window.ENV.controlTypeGroups, function (index, group) {
  controlTypeGroupId++;
  $.each(group.controlTypes, function (index, control) {
    controlTypeId++;
    ControlType.FIXTURES.push($.extend({
      id: controlTypeId,
      group: controlTypeGroupId
    }, control));
  });
});

export default ControlType;
