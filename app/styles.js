import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  input: {
    height: 50,
    marginVertical: 7,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    width: 350,
    fontSize: 17
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    width: 350,
  },
  warningText: {
    color: '#856404',
    marginBottom: 10,
  },
  warningButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  consoleContainer: {
    width: 350,
    height: 200,
    marginTop: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  consoleTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  console: {
    flex: 1,
  },
  consoleText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  consolePlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  consoleFooter: {
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    paddingTop: 5,
    marginTop: 5,
  }
});