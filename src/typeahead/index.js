/**
 * @jsx React.DOM
 */

var React = require('react');
var TypeaheadSelector = require('./selector');
var KeyEvent = require('../keyevent');
var fuzzy = require('fuzzy');
var classNames = require('classnames');
var TextField = require('material-ui').TextField;
var _ = require('lodash');

var IDENTITY_FN = function(input) { return input; };
var _generateAccessor = function(field) {
  return function(object) { return object[field]; };
};

/**
 * A "typeahead", an auto-completing text input
 *
 * Renders an text input that shows options nearby that you can use the
 * keyboard or mouse to select.  Requires CSS for MASSIVE DAMAGE.
 */
var Typeahead = React.createClass({
  propTypes: {
    name: React.PropTypes.string,
    customClasses: React.PropTypes.object,
    maxVisible: React.PropTypes.number,
    menuItems: React.PropTypes.array,
    allowCustomValues: React.PropTypes.number,
    defaultValue: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    inputProps: React.PropTypes.object,
    onOptionSelected: React.PropTypes.func,
    valueLink: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyUp: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    filterOption: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.func
    ]),
    displayOption: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.func
    ]),
    formInputOption: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.func
    ])
  },

  getDefaultProps: function() {
    return {
      mapItems: [],
      customClasses: {},
      allowCustomValues: 0,
      defaultValue: "",
      placeholder: "",
      inputProps: {},
      maxVisible: 10,
      onOptionSelected: function(option) {},
      onChange: function(event) {},
      onKeyDown: function(event) {},
      onKeyUp: function(event) {},
      onFocus: function(event) {},
      onBlur: this._onEscape,
      filterOption: null
    };
  },

  getInitialState: function() {
    return {
      // The currently visible set of options
      visible: this.getOptionsForValue(this.props.defaultValue, []),

      // This should be called something else, "entryValue"
      entryValue: _.result(_.find(this.props.menuItems, 'value', (this.props.valueLink ) ? this.props.valueLink.value : this.props.value ), 'label'),

      // A valid typeahead value
      selection: null,

      // Index of the selection
      selectionIndex: null
    };
  },

  getOptionsForValue: function(value, options) {
    var filterOptions = this._generateFilterFunction();
    var result = filterOptions(value, options);
    if (this.props.maxVisible) {
      result = result.slice(0, this.props.maxVisible);
    }
    return result;
  },

  setEntryText: function(value) {
    this.refs.entry.getDOMNode().value = value;
    this._onTextEntryUpdated();
  },

  focus: function(){
    React.findDOMNode(this.refs.entry).focus()
  },

  _hasCustomValue: function() {
    if (this.props.allowCustomValues > 0 &&
      this.state.entryValue.length >= this.props.allowCustomValues &&
      this.state.visible.indexOf(this.state.entryValue) < 0) {
      return true;
    }
    return false;
  },

  _getCustomValue: function() {
    if (this._hasCustomValue()) {
      return this.state.entryValue;
    }
    return null;
  },

  _renderIncrementalSearchResults: function() {
    // Nothing has been entered into the textbox
    if (!this.state.entryValue) {
      return "";
    }

    // Something was just selected
    if (this.state.selection) {
      return "";
    }

    // There are no typeahead / autocomplete suggestions
    if (!this._hasHint()) {
      return "";
    }

    return (
      <TypeaheadSelector
        ref="sel" options={this.state.visible}
        onOptionSelected={this._onOptionSelected}
        customValue={this._getCustomValue()}
        customClasses={this.props.customClasses}
        selectionIndex={this.state.selectionIndex}
        displayOption={this._generateOptionToStringFor(this.props.displayOption)} />
    );
  },

  getSelection: function() {
    var index = this.state.selectionIndex;
    if (this._hasCustomValue()) {
      if (index === 0) {
        return this.state.entryValue;
      } else {
        index--;
      }
    }
    return this.state.visible[index];
  },

  _onOptionSelected: function(option, event) {
    var nEntry = this.refs.entry.getDOMNode();
    nEntry.focus();

    var displayOption = this._generateOptionToStringFor(this.props.displayOption);
    var optionString = displayOption(option, 0);

    var formInputOption = this._generateOptionToStringFor(this.props.formInputOption || displayOption);
    var formInputOptionString = formInputOption(option);

    nEntry.value = optionString;
    this.setState({visible: this.getOptionsForValue(optionString, _.map(this.props.menuItems, 'label')),
                   selection: formInputOptionString,
                   entryValue: optionString});

    if (this.props.valueLink) {
      let matches = this.props.menuItems.filter(m => m.label == option);
      if (matches.length > 0) {
        return this.props.valueLink.requestChange(matches[0].value)
      }
    } else {
      return this.props.onOptionSelected(option, event);
    }
  },

  _onTextEntryUpdated: function(event) {
    var value = event.target.value;
    this.setState({visible: this.getOptionsForValue(value, _.map(this.props.menuItems, 'label')),
                   selection: null,
                   entryValue: value});
  },

  _onEnter: function(event) {
    var selection = this.getSelection();
    if (!selection) {
      return this.props.onKeyDown(event);
    }
    return this._onOptionSelected(selection, event);
  },

  _onEscape: function() {
    this.setState({
      selectionIndex: null
    });
  },

  _onTab: function(event) {
    var selection = this.getSelection();
    var option = selection ?
      selection : (this.state.visible.length > 0 ? this.state.visible[0] : null);

    if (option === null && this._hasCustomValue()) {
      option = this._getCustomValue();
    }

    if (option !== null) {
      return this._onOptionSelected(option, event);
    }
  },

  eventMap: function(event) {
    var events = {};

    events[KeyEvent.DOM_VK_UP] = this.navUp;
    events[KeyEvent.DOM_VK_DOWN] = this.navDown;
    events[KeyEvent.DOM_VK_RETURN] = events[KeyEvent.DOM_VK_ENTER] = this._onEnter;
    events[KeyEvent.DOM_VK_ESCAPE] = this._onEscape;
    events[KeyEvent.DOM_VK_TAB] = this._onTab;

    return events;
  },

  _nav: function(delta) {
    if (!this._hasHint()) {
      return;
    }
    var newIndex = this.state.selectionIndex === null ? (delta == 1 ? 0 : delta) : this.state.selectionIndex + delta;
    var length = this.state.visible.length;
    if (this._hasCustomValue()) {
      length += 1;
    }

    if (newIndex < 0) {
      newIndex += length;
    } else if (newIndex >= length) {
      newIndex -= length;
    }

    this.setState({selectionIndex: newIndex});
  },

  navDown: function() {
    this._nav(1);
  },

  navUp: function() {
    this._nav(-1);
  },

  _onChange: function(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }

    this._onTextEntryUpdated(event);
  },

  _onKeyDown: function(event) {
    // If there are no visible elements, don't perform selector navigation.
    // Just pass this up to the upstream onKeydown handler
    if (!this._hasHint()) {
      return this.props.onKeyDown(event);
    }

    var handler = this.eventMap()[event.keyCode];

    if (handler) {
      handler(event);
    } else {
      return this.props.onKeyDown(event);
    }
    // Don't propagate the keystroke back to the DOM/browser
    event.preventDefault();
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({
      visible: this.getOptionsForValue(this.state.entryValue, _.map(nextProps.menuItems, 'label'))
    });
  },

  style() {
    return {
      root: {
        position: 'relative'
      }
    };
  },

  render: function() {
    var inputClasses = {};
    inputClasses[this.props.customClasses.input] = !!this.props.customClasses.input;
    var inputClassList = classNames(inputClasses);

    var classes = {
      typeahead: true
    };
    classes[this.props.className] = !!this.props.className;
    var classList = classNames(classes);
    return (
      <div className={classList} style={this.style().root}>
        { this._renderHiddenInput() }
        <TextField ref="entry" type="text"
          {...this.props.inputProps}
          placeholder={this.props.placeholder}
          className={inputClassList}
          value={this.state.entryValue}
          onChange={this._onChange}
          onKeyDown={this._onKeyDown}
          onKeyUp={this.props.onKeyUp}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
        />
        { this._renderIncrementalSearchResults() }
      </div>
    );
  },

  _renderHiddenInput: function() {
    if (!this.props.name) {
      return null;
    }

    return (
      <input
        type="hidden"
        name={ this.props.name }
        value={ this.state.selection }
      />
    );
  },

  _generateFilterFunction: function() {
    var filterOptionProp = this.props.filterOption;
    if (typeof filterOptionProp === 'function') {
      return function(value, options) {
        return options.filter(function(o) { return filterOptionProp(value, o); });
      };
    } else {
      var mapper;
      if (typeof filterOptionProp === 'string') {
        mapper = _generateAccessor(filterOptionProp);
      } else {
        mapper = IDENTITY_FN;
      }
      return function(value, options) {
        var transformedOptions = options.map(mapper);
        return fuzzy
          .filter(value, transformedOptions)
          .map(function(res) { return options[res.index]; });
      };
    }
  },

  _generateOptionToStringFor: function(prop) {
    if (typeof prop === 'string') {
      return _generateAccessor(prop);
    } else if (typeof prop === 'function') {
      return prop;
    } else {
      return IDENTITY_FN;
    }
  },

  _hasHint: function() {
    return this.state.visible.length > 0 || this._hasCustomValue();
  },

  _onBlur(event) {
    this.setState({ visible: false})
  },

  // Todo onfocus show options

});

module.exports = Typeahead;
