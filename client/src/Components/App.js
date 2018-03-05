import React, { Component } from 'react';
import axios from 'axios';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import moment from 'moment';

const columns = [
  { Header: 'Index', accessor: 'index' },
  { Header: 'Earliest', id: 'begin', accessor: data => moment(data.begin).format('YYYY-MM-DD HH:MM') },
  { Header: 'Latest', id: 'end', accessor: data => moment(data.end).format('YYYY-MM-DD HH:MM') },
  { Header: 'Diffs?', id: 'diff', accessor: data => data.diff ? 'Yes' : 'No' }
];

const subColumns = [
  { Header: 'Kind', accessor: 'kind' },
  { Header: 'Path', accessor: 'path' },
  { Header: 'LHS', accessor: 'lhs' },
  { Header: 'RHS', accessor: 'rhs' }
];


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      data: []
    };

    this.fetchData.bind(this);
  }

  async fetchData() {
    const stats = await axios.get('/analysis/diffs').then(res => res.data);
    return this.setState({ loading: false, data: stats });
  }

  componentDidMount() {
    this.fetchData();
  }

  render() {
    const { loading, data } = this.state;
    const dataTable = (
      <ReactTable
        data={data}
        columns={columns}
        filterable={true}
        SubComponent={row =>
          row.original.diff ?
            <ReactTable
              data={row.original.diff}
              columns={subColumns}
              pageSize={row.original.diff.length}
              showPagination={false}
            /> : null
        }
      />
    );

    return (
      <div>
        <h1>Elasticsearch Index Analysis</h1>
        { loading ? <p>Loading...</p> : dataTable }
      </div>
    );
  }
}

export default App;
