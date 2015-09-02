/**
 * @jsx React.DOM
 */

var React = require('react');
var classNames = require('classnames');
var _ = require('lodash');

/**
 * A single option within the TypeaheadSelector
 */
var TypeaheadOption = React.createClass({
  propTypes: {
    customClasses: React.PropTypes.object,
    customValue: React.PropTypes.string,
    onClick: React.PropTypes.func,
    children: React.PropTypes.string,
    hover: React.PropTypes.bool
  },

  getInitialState: function() {
    return {
      hover: false
    }
  },

  getDefaultProps: function() {
    return {
      customClasses: {},
      onClick: function(event) {
        event.preventDefault();
      }
    };
  },

  style() {
    return {
      root: {
        backgroundColor: this.context.muiTheme.component.menu.backgroundColor
      },
      hover: {
        backgroundColor: this.context.muiTheme.component.menuItem.hoverColor
      },
      link: {
        textDecoration: 'none',
        color: this.context.muiTheme.palette.textColor,
        padding: '5px 25px',
        width: '100%',
        display: 'block'
      }
    }
  },

  contextTypes: {
    muiTheme: React.PropTypes.object
  },

  render: function() {

    var hoverStyle = (this.props.hover || this.state.hover) ? _.assign(this.style().root, this.style().hover) : this.style().root;

    return (
      <li style={hoverStyle} onMouseOver={this._onHover} onMouseOut={this._onHover} onMouseDown={this._onClick} >
        <a href="javascript: void 0;" style={this.style().link} className={this._getClasses()} ref="anchor">
          { this.props.children }
        </a>
      </li>
    );
  },

  _onHover: function(event) {
    if(event.type === 'mouseover'){
      this.setState({hover: true});
    } else if (event.type === 'mouseout') {
      this.setState({hover: false});
    }
  },

  _getClasses: function() {
    var classes = {
      "typeahead-option": true,
    };
    classes[this.props.customClasses.listAnchor] = !!this.props.customClasses.listAnchor;

    return classNames(classes);
  },

  _onClick: function(event) {
    event.preventDefault();
    return this.props.onClick(event);
  }
});


module.exports = TypeaheadOption;
